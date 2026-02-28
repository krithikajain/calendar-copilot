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

class ChatResponse(BaseModel):
    reply: str
