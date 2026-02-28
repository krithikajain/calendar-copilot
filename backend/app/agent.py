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
    
    return {
        "intent": intent,
        "category": category,
        "timeframe": "recent" # simplified MVP
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
    stats = compute_time_stats(events_context)
    intent_data = rule_based_router(message)
    
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
    return (
        "You are Calendar Copilot, a helpful AI assistant analyzing the user's Google Calendar. "
        "Keep your answers concise, structured (use Markdown bullets), and grounded entirely in the calendar data. "
        f"Calculated Data Context: The user has spent time across categories as follows: {json.dumps(stats)}.\n"
        f"The user intent was detected as: {intent_data['intent']}.\n"
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
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        sys_prompt = build_system_prompt(intent_data, stats)
        prompt = f"System Context:\n{sys_prompt}\n\nUser Question:\n{message}"
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error with Gemini: {str(e)}\n\nFallback: " + fallback_llm_response(intent_data, stats, events)
