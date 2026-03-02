from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

class ToolCall(BaseModel):
    name: str
    args: Dict[str, Any] = Field(default_factory=dict)

class TimeRange(BaseModel):
    start_iso: Optional[str] = None
    end_iso: Optional[str] = None
    description: Optional[str] = None

class Constraints(BaseModel):
    days_of_week: Optional[List[str]] = None
    time_window_start_hour: Optional[int] = None
    time_window_end_hour: Optional[int] = None
    notes: Optional[List[str]] = None

class Plan(BaseModel):
    intent: Literal["create_event_request", "email_draft_general", "email_draft_with_slots", "day_brief", "week_brief", "meeting_time_and_reduce", "unknown"]
    time_range: Optional[TimeRange] = None
    constraints: Optional[Constraints] = None
    duration_minutes: Optional[int] = 30
    tool_calls: List[ToolCall] = Field(default_factory=list)
    needs_user_input: bool = False
    missing_fields: List[str] = Field(default_factory=list)

class EmailDraftContract(BaseModel):
    to_name: Optional[str] = None
    to_email: Optional[str] = None
    subject: str
    body: str
    slots: List[dict] = Field(default_factory=list)

class DraftEventContract(BaseModel):
    title: str
    start: str
    end: str
    attendees: Optional[List[str]] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class UIActionsContract(BaseModel):
    open_create_event_modal: Optional[bool] = False

class ValidationContract(BaseModel):
    conflict: Optional[bool] = False
    conflicting_events: Optional[List[dict]] = None

class ResponseContract(BaseModel):
    assistant_message: str
    email_drafts: Optional[List[EmailDraftContract]] = None
    day_brief: Optional[str] = None
    week_brief: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None
    needs_user_input: Optional[bool] = False
    missing_fields: Optional[List[str]] = None
    reply: Optional[str] = None
    intent: Optional[str] = None
    draft_event: Optional[DraftEventContract] = None
    ui_actions: Optional[UIActionsContract] = None
    validation: Optional[ValidationContract] = None
