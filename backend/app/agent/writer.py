import json
from typing import Dict, Any
from .schemas import Plan, ResponseContract, EmailDraftContract
from app.llm.provider import LLMProvider

class WriterAgent:
    def __init__(self, provider: LLMProvider):
        self.provider = provider
        
    def run(self, message: str, plan: Plan, tool_results: Dict[str, Any]) -> ResponseContract:
        system = f"""
        You are the Writer Agent. Your job is to generate a conversational response STRICTLY grounded in the provided tool_results.
        Your output MUST be pure JSON matching the contract exactly.
        
        Intent: {plan.intent}
        
        TOOL RESULTS:
        {json.dumps(tool_results, indent=2)}
        
        WRITING RULES:
        - IMPORTANT: ALWAYS use real newlines in your JSON strings for formatting. NEVER output the literal text sequence '\\n'.
        - For create_event_request: You MUST fill out the `draft_event` object using the user's requested title, date, start time, end time, and attendees. If duration is missing, default to 30 mins. If time is 'block' default to 3 hours starting at 9 AM, else if ambiguous morning default to 11 AM. You MUST set `ui_actions.open_create_event_modal = true`. Check tool_results if there is conflict mapping to `validation.conflict`. Do NOT draft an email.
        - For email_draft_with_slots: You MUST include EXACT slot options from tool_results (no invented times). Format them cleanly. Use the timezone label 'ET' with the slots. Include the draft in `email_drafts` array.
        - For email_draft_general: Output the draft in `email_drafts` array.
        - For day_brief / week_brief: Provide a conversational summary of their schedule. You MUST read the `events` array in tool_results and explicitly mention the titles of their events (e.g. "You have a 30-minute sync with Dan, an hour of Fitness, and 4 hours uncategorized"). DO NOT just genericize the whole day without mentioning the event titles!
        - For meeting_time_and_reduce: Use the meeting statistics in tool_results. Output a short conversational `assistant_message` about their meeting load and fill the `recommendations` array natively.
        - If slots_found is explicitly false in tool_results: Generate an `assistant_message` saying you couldn't find exact fits but offer the nearest alternatives provided. If you draft an email, ask the recipient for their alternative availability natively within the draft body.
        - DO NOT invent a 'to_email' if you do not know it. If there is a recognizable name in the query, put it in 'to_name' and leave 'to_email' null.
        - NEVER output calendar analytics in the email_draft intent. Only provide the requested draft.
        - Match the user's tone (e.g. casual vs neutral). 
        
        RESPONSE CONTRACT (DO NOT use markdown formatting, valid JSON only):
        {{
            "assistant_message": "A conversational reply framing your output",
            "email_drafts": [
                {{
                    "to_name": "Name",
                    "subject": "Email Subject",
                    "body": "Email body exactly with slots formatted nicely.",
                    "slots": []
                }}
            ],
            "draft_event": {{
                "title": "Clean concise title",
                "start": "2026-03-01T15:00:00-05:00",
                "end": "2026-03-01T15:30:00-05:00",
                "attendees": ["dan@example.com"],
                "location": "Optional location",
                "notes": "Optional notes"
            }},
            "ui_actions": {{
                "open_create_event_modal": false
            }},
            "validation": {{
                "conflict": false,
                "conflicting_events": []
            }},
            "day_brief": null,
            "week_brief": null,
            "metrics": null,
            "recommendations": []
        }}
        """
        
        resp_dict = self.provider.generate_json(system, message)
        if not resp_dict:
            print("Writer output generated empty JSON.")
            return self._rule_based_fallback(plan, tool_results)
            
        try:
            resp_dict["intent"] = plan.intent
            return ResponseContract(**resp_dict)
        except Exception as e:
            print(f"Writer output invalid: {e}, falling back. Raw response was: {resp_dict}")
            return self._rule_based_fallback(plan, tool_results)
            
    def _rule_based_fallback(self, plan: Plan, results: Dict[str, Any]) -> ResponseContract:
        from .schemas import DraftEventContract, UIActionsContract, ValidationContract
        if plan.intent == "create_event_request":
            import datetime
            now_str = datetime.datetime.now().isoformat()
            draft = DraftEventContract(
                title="New Event",
                start=now_str,
                end=now_str,  # simplistic fallback
                attendees=[],
                location="",
                notes=""
            )
            return ResponseContract(
                assistant_message="I've drafted the event for you. Please review and confirm.",
                intent=plan.intent,
                draft_event=draft,
                ui_actions=UIActionsContract(open_create_event_modal=True),
                validation=ValidationContract(conflict=False, conflicting_events=[])
            )
        elif "draft" in plan.intent:
            drafts = []
            msg = "Here is your requested draft."
            slots = results.get("slot_options", [])
            
            if "slot_options" in results and not results.get("slots_found"):
                msg = "I couldn't find slots inside exactly those constraints, but here are some alternatives."
            
            body = "Hi,\\n\\nI just wanted to reach out regarding our sync.\\n"
            if slots:
                import datetime
                body_slots = "\\n".join(datetime.datetime.fromisoformat(s["start"]).strftime('%A, %b %d at %I:%M %p') + " ET" for s in slots)
                body += f"\\nWould any of these times work for you?\\n{body_slots}\\n"
            body += "\\nLet me know what works best.\\n\\nBest,\\n[Your Name]"
            
            drafts.append(EmailDraftContract(
                to_name="Recipient",
                subject="Following up",
                body=body,
                slots=slots
            ))
            return ResponseContract(assistant_message=msg, email_drafts=drafts, intent=plan.intent)
        elif plan.intent in ["day_brief", "week_brief"]:
            events = results.get("events", [])
            if isinstance(events, list) and len(events) > 0:
                from collections import defaultdict
                cat_counts = defaultdict(int)
                uncategorized_titles = []
                for e in events:
                    cat = e.get("category", "Uncategorized")
                    if cat == "Shared": cat = "Meeting" # Group Shared as Meetings
                    cat_counts[cat] += 1
                    if cat == "Uncategorized":
                        uncategorized_titles.append(e.get("title", "Event"))
                
                parts = []
                for cat, count in cat_counts.items():
                    if cat != "Uncategorized":
                        parts.append(f"{count} {cat.lower()} event{'s' if count > 1 else ''}")
                
                msg = f"You have {len(events)} events in this timeframe"
                if parts:
                    msg += ", including " + ", ".join(parts) + "."
                else:
                    msg += "."
                    
                if uncategorized_titles:
                    titles_str = ", ".join(uncategorized_titles[:3])
                    if len(uncategorized_titles) > 3:
                        titles_str += " and more"
                    msg += f" You also have {len(uncategorized_titles)} uncategorized event{'s' if len(uncategorized_titles) > 1 else ''}: {titles_str}."
            elif isinstance(events, str):
                msg = events
            else:
                msg = "You have no scheduled events for this timeframe. Enjoy your free time!"
            return ResponseContract(assistant_message=msg, intent=plan.intent)
        elif plan.intent == "meeting_time_and_reduce":
            msg = "Here are your meeting insights."
            reco = results.get("recommendations", [])
            if reco: msg = reco[0]
            return ResponseContract(assistant_message=msg, metrics=results.get("stats"), recommendations=reco, intent=plan.intent)
        else:
            return ResponseContract(assistant_message="Here is your calendar data.", intent=plan.intent)
