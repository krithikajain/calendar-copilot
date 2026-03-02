from pydantic import BaseModel
from typing import List, Optional

class Event(BaseModel):
    id: str
    title: str
    start: str
    end: str
    attendeesCount: int
    location: Optional[str] = None
    organizer: Optional[str] = None
    htmlLink: Optional[str] = None
    category: str = "Uncategorized"
    tagColor: str = "bg-gray-100 text-gray-800"

class ChatRequest(BaseModel):
    message: str

class PersonEmail(BaseModel):
    name: str
    email: Optional[str] = None

class TimeFrame(BaseModel):
    start: str
    end: str

class Constraints(BaseModel):
    days_of_week: Optional[List[str]] = None
    time_window: Optional[dict] = None
    notes: Optional[List[str]] = None

class ScheduleRequest(BaseModel):
    people: List[PersonEmail]
    timeframe: TimeFrame
    duration_minutes: int
    constraints: Constraints

class EmailDraft(BaseModel):
    to_name: Optional[str] = None
    to_email: Optional[str] = None
    subject: str
    body: str
    slots: List[dict]

class CreateEventRequest(BaseModel):
    title: str
    start: str
    end: str
    attendees: Optional[List[str]] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    calendarId: Optional[str] = "primary"
    timeZone: Optional[str] = "America/New_York"

class DraftEvent(BaseModel):
    title: str
    start: str
    end: str
    attendees: Optional[List[str]] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class UIActions(BaseModel):
    open_create_event_modal: Optional[bool] = False

class Validation(BaseModel):
    conflict: Optional[bool] = False
    conflicting_events: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    reply: str  # For legacy compatibility, though frontend will transition to using assistant_message
    assistant_message: Optional[str] = None
    intent: Optional[str] = None
    schedule_request: Optional[ScheduleRequest] = None
    slot_options_by_person: Optional[dict] = None
    email_drafts: Optional[List[EmailDraft]] = None
    needs_user_input: Optional[bool] = False
    missing_emails: Optional[List[str]] = None
    hint: Optional[str] = None
    draft_event: Optional[DraftEvent] = None
    ui_actions: Optional[UIActions] = None
    validation: Optional[Validation] = None
    day_brief: Optional[str] = None
    week_brief: Optional[str] = None
    metrics: Optional[dict] = None
    recommendations: Optional[List[str]] = None
