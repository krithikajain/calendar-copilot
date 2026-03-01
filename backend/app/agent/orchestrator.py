from app.llm.provider import LLMProvider
from .planner import PlannerAgent
from .tool_registry import ToolRunner
from .writer import WriterAgent
from app.tools.contacts_tools import lookup_contact_email
import re

class Orchestrator:
    def __init__(self, google_creds):
        self.provider = LLMProvider()
        self.planner = PlannerAgent(self.provider)
        self.tool_runner = ToolRunner(google_creds)
        self.writer = WriterAgent(self.provider)
        
    def process_chat(self, message: str, tz_str: str) -> dict:
        print("[Orchestrator] Running Planner")
        plan = self.planner.run(message, tz_str)
        # dev logging
        print("--- PLAN ---")
        print(plan.model_dump_json(indent=2))
        
        print("[Orchestrator] Running Tools")
        tool_results = self.tool_runner.run(plan, tz_str)
        
        print("[Orchestrator] Running Writer")
        response = self.writer.run(message, plan, tool_results)
        
        # Hydrate emails from SQLite lookup
        if response.email_drafts:
            for draft in response.email_drafts:
                if draft.to_name and not draft.to_email:
                    # check if the user literally sent an email address
                    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
                    urls = re.findall(email_pattern, message)
                    if urls:
                        draft.to_email = urls[0]
                    else:
                        email_looked_up = lookup_contact_email(draft.to_name)
                        if email_looked_up:
                            draft.to_email = email_looked_up
                        else:
                            response.needs_user_input = True
                            if not response.missing_fields:
                                response.missing_fields = []
                            response.missing_fields.append("email")
                            
        res_dict = response.model_dump()
        res_dict["reply"] = res_dict["assistant_message"]
        
        # Map missing_fields to missing_emails for front-end models
        if res_dict.get("missing_fields"):
            res_dict["missing_emails"] = res_dict["missing_fields"]
            del res_dict["missing_fields"]
        
        # Ensure older payload fields map cleanly
        if not res_dict.get("email_drafts"):
            res_dict["email_drafts"] = []
            
        print("[Orchestrator] Complete")
        return res_dict
