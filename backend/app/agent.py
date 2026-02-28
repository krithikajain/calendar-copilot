import os
import json
from .tools import compute_time_stats, generate_reduce_meetings_suggestions, generate_protect_mornings_suggestions

def rule_based_router(message: str) -> dict:
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
    elif "fitness" in msg or "workout" in msg: category = "Fitness"
    elif "focus" in msg: category = "Focus"
    
    timeframe = "recent"
    if "morning" in msg:
        timeframe = "morning"
    elif "afternoon" in msg:
        timeframe = "afternoon"
    elif "evening" in msg or "night" in msg and "tonight" not in msg:
        timeframe = "evening"
    elif "next week" in msg:
        timeframe = "next week"
    elif "weekend" in msg:
        timeframe = "weekend"
    elif "today" in msg or "tonight" in msg:
        timeframe = "today"
    elif "tomorrow" in msg:
        timeframe = "tomorrow"
    elif "week" in msg:
        timeframe = "this week"
        
    return {
        "intent": intent,
        "category": category,
        "timeframe": timeframe
    }

def fallback_llm_response(intent_data: dict, stats: dict, events) -> str:
    intent = intent_data["intent"]
    cat = intent_data["category"]
    
    if intent == "time_analysis":
        if cat and cat in stats:
            return f"Based on your recent calendar, you spent approximately **{stats[cat]:.1f} hours** in {cat}."
        else:
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
        
    return "I am a simple rule-based fallback right now. Try asking me 'How much time did I spend in meetings?' or 'How can I reduce meetings?'."

def process_chat(message: str, events_context: list) -> str:
    intent_data = rule_based_router(message)
    
    import datetime
    now = datetime.datetime.now()
    filtered_events = []
    timeframe = intent_data.get("timeframe", "recent")
    
    for e in events_context:
        try:
            # Simple timezone stripped comparison for the demo
            start = datetime.datetime.fromisoformat(e["start"].replace("Z", "+00:00")).replace(tzinfo=None)
            if timeframe == "today":
                if start.date() == now.date():
                    filtered_events.append(e)
            elif timeframe == "tomorrow":
                if start.date() == (now + datetime.timedelta(days=1)).date():
                    filtered_events.append(e)
            elif timeframe == "this week":
                if now.date() <= start.date() <= (now + datetime.timedelta(days=7)).date():
                    filtered_events.append(e)
            elif timeframe == "morning":
                if start.date() == now.date() and 5 <= start.hour < 12:
                    filtered_events.append(e)
            elif timeframe == "afternoon":
                if start.date() == now.date() and 12 <= start.hour < 17:
                    filtered_events.append(e)
            elif timeframe == "evening":
                if start.date() == now.date() and 17 <= start.hour <= 23:
                    filtered_events.append(e)
            elif timeframe == "next week":
                next_week_start = now.date() + datetime.timedelta(days=7 - now.weekday())
                next_week_end = next_week_start + datetime.timedelta(days=6)
                if next_week_start <= start.date() <= next_week_end:
                    filtered_events.append(e)
            elif timeframe == "weekend":
                # Get the nearest upcoming Saturday/Sunday
                days_ahead = 5 - now.weekday()
                if days_ahead < 0: days_ahead += 7
                saturday = now.date() + datetime.timedelta(days=days_ahead)
                sunday = saturday + datetime.timedelta(days=1)
                
                if start.date() in [saturday, sunday]:
                    filtered_events.append(e)
            else:
                filtered_events.append(e)
        except:
            filtered_events.append(e)
            
    stats = compute_time_stats(filtered_events)
    
    # We pass filtered_events instead of full context downstream
    events_context = filtered_events
    
    # Try OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and len(openai_key) > 5:
        return process_with_openai(message, intent_data, stats, events_context, openai_key)
        
    # Try Gemini
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and len(gemini_key) > 5:
        return process_with_gemini(message, intent_data, stats, events_context, gemini_key)
        
    # Deterministic Fallback
    return fallback_llm_response(intent_data, stats, events_context)

def build_system_prompt(intent_data, stats):
    active_stats = {k: v for k, v in stats.items() if v > 0}
    top_stats = dict(sorted(active_stats.items(), key=lambda item: item[1], reverse=True)[:3])
    
    return (
        "You are Cora, a helpful and conversational AI assistant for Co-Calendar analyzing the user's schedule. "
        "Keep your answers concise, natural, and grounded entirely in the calculated calendar data. "
        f"You are explicitly analyzing this granular time slice ONLY: '{intent_data.get('timeframe', 'recent')}'. "
        f"Top Priorities/Categories for this exact timeframe slice: {json.dumps(top_stats)}.\n"
        "State clearly that you are looking at this specific timeframe slice. Do not just list raw metrics; explicitly synthesize what this timeframe looks like functionally based ONLY on those top highlighted categories.\n"
        f"User intent detected: {intent_data['intent']}.\n"
    )

def process_with_openai(message: str, intent_data: dict, stats: dict, events, api_key: str) -> str:
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        
        sys_prompt = build_system_prompt(intent_data, stats)
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
    except Exception as e:
        return f"Error with OpenAI: {str(e)}\n\nFallback: " + fallback_llm_response(intent_data, stats, events)

def process_with_gemini(message: str, intent_data: dict, stats: dict, events, api_key: str) -> str:
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        sys_prompt = build_system_prompt(intent_data, stats)
        prompt = f"System Context:\n{sys_prompt}\n\nUser Question:\n{message}"
        
        try:
            response = client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=prompt,
            )
            return response.text
        except Exception as flash_err:
            if "404" in str(flash_err) or "not found" in str(flash_err):
                # Fallback to the stable older model if package doesn't recognize flash
                response = client.models.generate_content(
                    model="gemini-3-flash-preview",
                    contents=prompt,
                )
                return response.text
            raise flash_err
            
    except Exception as e:
        return f"Error with Gemini: {str(e)}\n\nFallback: " + fallback_llm_response(intent_data, stats, events)
