import os
import json
import datetime
from typing import Dict, List, Any

from .tools import compute_time_stats, generate_reduce_meetings_suggestions, generate_protect_mornings_suggestions

class CalendarAgent:
    """
    A modular agent orchestrator for parsing natural language queries
    and grounding LLM predictions in contextual calendar statistics.
    """
    def __init__(self, events_context: List[Dict[str, Any]]):
        self.events_context = events_context
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        
    def _route_intent(self, message: str) -> Dict[str, Any]:
        """Detects functional intent, category focus, and targeted timeframe."""
        msg = message.lower()
        intent = "general_question"
        
        if "reduce" in msg and "meeting" in msg:
            intent = "reduce_meetings"
        elif "protect" in msg and "morning" in msg:
            intent = "protect_mornings_strategy"
        elif "time" in msg and ("spend" in msg or "spent" in msg):
            intent = "time_analysis"
            
        category = None
        if "meeting" in msg: category = "Meeting"
        elif "fitness" in msg or "workout" in msg or "gym" in msg: category = "Fitness"
        elif "focus" in msg: category = "Focus"
        
        timeframe = "recent"
        if "morning" in msg: timeframe = "morning"
        elif "afternoon" in msg: timeframe = "afternoon"
        elif "evening" in msg or "night" in msg and "tonight" not in msg: timeframe = "evening"
        elif "next week" in msg: timeframe = "next week"
        elif "weekend" in msg: timeframe = "weekend"
        elif "today" in msg or "tonight" in msg: timeframe = "today"
        elif "tomorrow" in msg: timeframe = "tomorrow"
        elif "week" in msg: timeframe = "this week"
            
        return {
            "intent": intent,
            "category": category,
            "timeframe": timeframe
        }
        
    def _filter_events_by_timeframe(self, events: List[Dict[str, Any]], timeframe: str) -> List[Dict[str, Any]]:
        """Removes calendar nodes outside the active user focus to prevent LLM hallucinations."""
        now = datetime.datetime.now()
        filtered = []
        
        for e in events:
            try:
                # Basic timezone stripping for MVP logic comparisons
                start = datetime.datetime.fromisoformat(e["start"].replace("Z", "+00:00")).replace(tzinfo=None)
                
                if timeframe == "today" and start.date() == now.date(): filtered.append(e)
                elif timeframe == "tomorrow" and start.date() == (now + datetime.timedelta(days=1)).date(): filtered.append(e)
                elif timeframe == "this week" and now.date() <= start.date() <= (now + datetime.timedelta(days=7)).date(): filtered.append(e)
                elif timeframe == "morning" and start.date() == now.date() and 5 <= start.hour < 12: filtered.append(e)
                elif timeframe == "afternoon" and start.date() == now.date() and 12 <= start.hour < 17: filtered.append(e)
                elif timeframe == "evening" and start.date() == now.date() and 17 <= start.hour <= 23: filtered.append(e)
                elif timeframe == "next week":
                    next_week_start = now.date() + datetime.timedelta(days=7 - now.weekday())
                    next_week_end = next_week_start + datetime.timedelta(days=6)
                    if next_week_start <= start.date() <= next_week_end: filtered.append(e)
                elif timeframe == "weekend":
                    days_ahead = 5 - now.weekday()
                    if days_ahead < 0: days_ahead += 7
                    saturday = now.date() + datetime.timedelta(days=days_ahead)
                    sunday = saturday + datetime.timedelta(days=1)
                    if start.date() in [saturday, sunday]: filtered.append(e)
                elif timeframe == "recent":
                    filtered.append(e)
            except Exception:
                # If date parsing fails, retain the event safely
                filtered.append(e)
                
        return filtered

    def _build_system_prompt(self, intent_data: Dict[str, str], stats: Dict[str, float]) -> str:
        """Constructs a heavily restricted instruction set feeding deterministic stats to the generative model."""
        # Filter out Uncategorized from Top 3 tasks; it behaves as free time
        active_stats = {k: v for k, v in stats.items() if v > 0 and k != "Uncategorized"}
        sorted_items = sorted(active_stats.items(), key=lambda item: item[1], reverse=True)
        top_stats = {k: v for i, (k, v) in enumerate(sorted_items) if i < 3}
        
        uncategorized_hrs = stats.get("Uncategorized", 0)
        
        prompt_rules = [
            "1. Identify Uncategorized time as free, open, flexible, or unstructured time.",
            "2. Do not overload the user with exact numbers, hours, or percentages unless they explicitly ask for 'time', 'hours', or 'percentage'. Otherwise, summarize conceptually (e.g. 'You have a light week').",
            "3. Use natural language understanding to map user terms (e.g., 'gym', 'run') to the provided categories (e.g., 'Fitness').",
            "4. State clearly that you are looking at the specific timeframe slice you are targeting. Do not just list raw metrics; synthesize what this timeframe looks like functionally.",
        ]
        
        return (
            "You are Koala, a helpful and conversational AI assistant for Ko-Calendar analyzing the user's schedule.\n"
            "Keep your answers concise, natural, and grounded entirely in the calculated calendar data.\n"
            f"You are explicitly analyzing this granular time slice ONLY: '{intent_data.get('timeframe', 'recent')}'.\n"
            f"Scheduled Priorities for this exact timeframe slice: {json.dumps(top_stats)}.\n"
            f"Unscheduled/Flexible Free Time: {uncategorized_hrs} hours.\n\n"
            "RULES:\n" + "\n".join(prompt_rules) + "\n\n"
            f"User intent detected: {intent_data['intent']}.\n"
        )
        
    def _fallback_response(self, intent_data: Dict[str, str], stats: Dict[str, float], events: List[Dict[str, Any]]) -> str:
        """Deterministic safety net executed if LLM endpoints completely fail."""
        intent = intent_data["intent"]
        cat = intent_data["category"]
        
        if intent == "time_analysis":
            if cat and cat in stats:
                return f"Based on your recent calendar, you spent approximately **{stats[cat]:.1f} hours** in {cat}."
            lines = ["Here is a breakdown of your recent time:"]
            for c, hrs in stats.items():
                if hrs > 0:
                    lines.append(f"- **{c}**: {hrs:.1f} hours")
            return "\n".join(lines)
                
        elif intent == "reduce_meetings":
            suggs = generate_reduce_meetings_suggestions(events, stats)
            return "Here is a strategy to reduce your meetings:\n\n" + "\n".join(f"- {s}" for s in suggs)
            
        elif intent == "protect_mornings_strategy":
            suggs = generate_protect_mornings_suggestions(events)
            return "Here is a strategy to protect your mornings:\n\n" + "\n".join(f"- {s}" for s in suggs)
            
        return "I am a simple rule-based fallback right now. Try asking me 'How much time did I spend in meetings?'."

    def _call_openai(self, message: str, intent_data: Dict[str, str], stats: Dict[str, float]) -> str:
        import openai
        client = openai.OpenAI(api_key=self.openai_key)
        
        sys_prompt = self._build_system_prompt(intent_data, stats)
        if intent_data["intent"] == "reduce_meetings":
            sys_prompt += " Specifically focus on ways to reduce their meeting load based on realistic strategies."
        elif intent_data["intent"] == "protect_mornings_strategy":
            sys_prompt += " Specifically focus on strategies to keep their mornings free for focus or fitness."
            
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.4
        )
        return resp.choices[0].message.content

    def _call_gemini(self, message: str, intent_data: Dict[str, str], stats: Dict[str, float], prompt_cache: str) -> str:
        from google import genai
        client = genai.Client(api_key=self.gemini_key)
        
        try:
            response = client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=prompt_cache,
            )
            return response.text
        except Exception as flash_err:
            if "404" in str(flash_err) or "not found" in str(flash_err):
                # Regional fallback
                response = client.models.generate_content(
                    model="gemini-pro",
                    contents=prompt_cache,
                )
                return response.text
            raise flash_err

    def process_message(self, message: str) -> str:
        """Main pipeline integrating routing, filtering, calculating, and generative synthesis."""
        intent_data = self._route_intent(message)
        filtered_events = self._filter_events_by_timeframe(self.events_context, intent_data.get("timeframe", "recent"))
        stats = compute_time_stats(filtered_events)
        
        # 1. Attempt OpenAI
        if self.openai_key and len(self.openai_key or "") > 5:
            try:
                return self._call_openai(message, intent_data, stats)
            except Exception as e:
                return f"Error with OpenAI: {str(e)}\n\nFallback: " + self._fallback_response(intent_data, stats, filtered_events)
                
        # 2. Attempt Google GenAI
        if self.gemini_key and len(self.gemini_key or "") > 5:
            try:
                sys_prompt = self._build_system_prompt(intent_data, stats)
                cached_prompt = f"System Context:\n{sys_prompt}\n\nUser Question:\n{message}"
                return self._call_gemini(message, intent_data, stats, cached_prompt)
            except Exception as e:
                return f"Error with Gemini: {str(e)}\n\nFallback: " + self._fallback_response(intent_data, stats, filtered_events)
                
        # 3. Deterministic execution
        return self._fallback_response(intent_data, stats, filtered_events)

def process_chat(message: str, events_context: list) -> str:
    """Wrapper function maintaining functional backward compatibility for main.py"""
    agent = CalendarAgent(events_context)
    return agent.process_message(message)
