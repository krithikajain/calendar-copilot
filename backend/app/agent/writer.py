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
        - For email_draft_with_slots: You MUST include EXACT slot options from tool_results (no invented times). Format them cleanly. Use the timezone label 'ET' with the slots. Include the draft in `email_drafts` array.
        - For email_draft_general: Output the draft in `email_drafts` array.
        - For meeting_time_and_reduce: Use only meeting counts/hours and recommendations given in tool_results. Output a short conversational `assistant_message` and fill `metrics` and `recommendations` arrays.
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
            "day_brief": null,
            "week_brief": null,
            "metrics": null,
            "recommendations": []
        }}
        """
        
        resp_dict = self.provider.generate_json(system, message)
        if not resp_dict:
            return self._rule_based_fallback(plan, tool_results)
            
        try:
            resp_dict["intent"] = plan.intent
            return ResponseContract(**resp_dict)
        except Exception as e:
            print(f"Writer output invalid: {e}, falling back.")
            return self._rule_based_fallback(plan, tool_results)
            
    def _rule_based_fallback(self, plan: Plan, results: Dict[str, Any]) -> ResponseContract:
        if "draft" in plan.intent:
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
        else:
            return ResponseContract(assistant_message="Here is your calendar data.", intent=plan.intent)
