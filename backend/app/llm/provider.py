import os
import json
from google import genai
from google.genai import types

class LLMProvider:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.has_key = bool(self.gemini_key)
        self.model_name = "gemini-2.0-flash"
        if self.has_key:
            self.client = genai.Client(api_key=self.gemini_key)

    def generate_json(self, system: str, user: str, schema_hint: dict = None) -> dict:
        if not self.has_key:
            return {}
            
        try:
            resp = self.client.models.generate_content(
                model=self.model_name,
                contents=user,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    response_mime_type="application/json"
                )
            )
            text = resp.text.strip()
            if text.startswith('```json'):
                text = text[7:]
            if text.startswith('```'):
                text = text[3:]
            if text.endswith('```'):
                text = text[:-3]
            return json.loads(text.strip())
        except Exception as e:
            print(f"[LLM JSON Error] {e}")
            return {}

    def generate_text(self, system: str, user: str) -> str:
        if not self.has_key:
            return ""
        try:
            resp = self.client.models.generate_content(
                model=self.model_name,
                contents=user,
                config=types.GenerateContentConfig(
                    system_instruction=system
                )
            )
            return resp.text.strip()
        except Exception as e:
            print(f"[LLM Text Error] {e}")
            return ""
