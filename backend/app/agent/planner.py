import datetime
import zoneinfo
from typing import Dict, Any
from .schemas import Plan, ToolCall, TimeRange, Constraints
from app.llm.provider import LLMProvider

class PlannerAgent:
    def __init__(self, provider: LLMProvider):
        self.provider = provider
        
    def run(self, message: str, tz_str: str) -> Plan:
        now = datetime.datetime.now(zoneinfo.ZoneInfo(tz_str))
        date_context = now.strftime("%Y-%m-%d %H:%M:%S")
        day_of_week = now.strftime("%A")
        
        system = f"""
        You are the Planner Agent. Your job is to classify the user's intent and output a strict JSON plan according to the user message.
        Current Time: {date_context} ({day_of_week}, timezone: {tz_str})
        
        ALLOWED INTENTS:
        1. email_draft_with_slots (implied scheduling: meet, call, lunch, coffee, sync, availability, time)
        2. email_draft_general (email, draft, remind, follow up, reach out - but NOT scheduling)
        3. day_brief (asking about today/tomorrow)
        4. week_brief (asking about this week/next week)
        5. meeting_time_and_reduce (asking about time in meetings or how to reduce meetings)
        6. unknown (none of the above)
        
        If intent relates to email/draft:
        - Route email drafting FIRST. Never inject analytics unless user explicitly requested.
        - If scheduling is implied -> intent: "email_draft_with_slots", tool_calls: ["get_events", "compute_free_slots"]
        - Else -> intent: "email_draft_general", tool_calls: []
        
        If intent is week_brief/day_brief -> tool_calls: ["get_events", "compute_time_stats", "compute_meeting_patterns"]
        If intent is meeting_time_and_reduce -> tool_calls: ["get_events", "compute_time_stats", "compute_meeting_patterns", "recommend_reduce_meetings"]
        
        Timeframe mapping (start_iso and end_iso MUST be valid ISO offsets like -05:00 based on timezone {tz_str}):
        - today: start=today 00:00, end=today+1 00:00
        - tomorrow: start=today+1 00:00, end=today+2 00:00
        - this week: start=today 00:00, end=next Mon 00:00
        - next week: start=next Mon 00:00, end=next Mon+7 00:00
        - "sat morning": start=next sat 00:00, end=next sat+1, constraints.notes="morning"
        
        Duration minutes defaults to 30. Extract duration if mentioned.
        
        Return ONLY valid JSON matching this schema:
        {{
            "intent": "email_draft_with_slots",
            "time_range": {{
                "start_iso": "yyyy-mm-ddT00:00:00-05:00",
                "end_iso": "yyyy-mm-ddT00:00:00-05:00",
                "description": "parsed description"
            }},
            "constraints": {{
                "days_of_week": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                "time_window_start_hour": 9,
                "time_window_end_hour": 17,
                "notes": ["morning"]
            }},
            "duration_minutes": 30,
            "tool_calls": [
                {{"name": "get_events"}}
            ],
            "needs_user_input": false,
            "missing_fields": []
        }}
        """
        
        plan_dict = self.provider.generate_json(system, message)
        
        if not plan_dict:
            return self._rule_based_fallback(message, tz_str)
            
        try:
            return Plan(**plan_dict)
        except Exception as e:
            print(f"Planner output invalid: {e}, falling back.")
            return self._rule_based_fallback(message, tz_str)

    def _rule_based_fallback(self, message: str, tz_str: str) -> Plan:
        msg_l = message.lower()
        intent = "unknown"
        calls = []
        
        if any(w in msg_l for w in ["email", "draft", "remind", "follow up", "reach out"]):
            if any(w in msg_l for w in ["meet", "call", "lunch", "coffee", "sync", "availability", "time", "block", "schedule"]):
                intent = "email_draft_with_slots"
                calls = [ToolCall(name="get_events"), ToolCall(name="compute_free_slots")]
            else:
                intent = "email_draft_general"
        elif "reduce" in msg_l or "much time" in msg_l:
            intent = "meeting_time_and_reduce"
            calls = [ToolCall(name="get_events"), ToolCall(name="compute_time_stats"), ToolCall(name="recommend_reduce_meetings")]
        elif "week" in msg_l:
             intent = "week_brief"
             calls = [ToolCall(name="get_events"), ToolCall(name="compute_time_stats")]
        else:
             intent = "day_brief"
             calls = [ToolCall(name="get_events"), ToolCall(name="compute_time_stats")]
             
        now = datetime.datetime.now(zoneinfo.ZoneInfo(tz_str))
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + datetime.timedelta(days=7)
        return Plan(
            intent=intent,
            time_range=TimeRange(start_iso=start.isoformat(), end_iso=end.isoformat(), description="fallback context"),
            tool_calls=calls
        )
