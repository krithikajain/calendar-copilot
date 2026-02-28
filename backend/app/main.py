import os
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app import database, models, google, agent

from dotenv import load_dotenv
load_dotenv()

database.init_db()

app = FastAPI(title="Calendar Copilot MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# A simple in-memory session store for MVP to relate requests to the user ID
# In production, use JWT or proper session cookies.
SESSION_STORE = {}

def get_current_user_id(request: Request) -> int:
    session_id = request.cookies.get("session_id")
    if not session_id or session_id not in SESSION_STORE:
        return None
    return SESSION_STORE[session_id]

@app.get("/auth/login")
def login():
    authorization_url, state = google.get_authorization_url()
    return RedirectResponse(authorization_url)

@app.get("/auth/callback")
def auth_callback(request: Request, db: Session = Depends(database.get_db)):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code omitted.")
    
    user_info, creds = google.fetch_token_and_user_info(code)
    
    # Store or update user in DB
    user = db.query(database.User).filter(database.User.google_id == user_info["id"]).first()
    if not user:
        user = database.User(google_id=user_info["id"], email=user_info.get("email"), name=user_info.get("name"))
        db.add(user)
    
    user.access_token = creds.token
    user.refresh_token = creds.refresh_token
    user.token_uri = creds.token_uri
    user.client_id = creds.client_id
    user.client_secret = creds.client_secret
    user.scopes = ",".join(creds.scopes)
    
    db.commit()
    db.refresh(user)

    # Set simple session cookie
    import uuid
    session_id = str(uuid.uuid4())
    SESSION_STORE[session_id] = user.id

    response = RedirectResponse(url=os.getenv("FRONTEND_URL", "http://localhost:5173"))
    response.set_cookie(key="session_id", value=session_id, httponly=True, max_age=86400*30)
    return response

@app.get("/api/me")
def get_me(request: Request, db: Session = Depends(database.get_db)):
    user_id = get_current_user_id(request)
    if not user_id:
        return {"authenticated": False}
    user = db.query(database.User).filter(database.User.id == user_id).first()
    if not user:
        return {"authenticated": False}
    return {"authenticated": True, "name": user.name, "email": user.email}

@app.get("/api/events")
def get_events(weekStart: str, request: Request, db: Session = Depends(database.get_db)):
    user_id = get_current_user_id(request)
    user = db.query(database.User).filter(database.User.id == user_id).first() if user_id else None
    
    # Calculate timeMin and timeMax for the week (7 days)
    time_min = datetime.strptime(weekStart, "%Y-%m-%d").isoformat() + "Z"
    time_max = (datetime.strptime(weekStart, "%Y-%m-%d") + timedelta(days=7)).isoformat() + "Z"

    if not user or not user.refresh_token:
        # Return elegant mock events for the demo if not fully connected
        return google.get_mock_events(weekStart)
    
    # Fetch real events
    creds = google.get_credentials_for_user(user)
    events = google.fetch_calendar_events(creds, time_min, time_max)
    
    return events

@app.post("/api/chat", response_model=models.ChatResponse)
def chat_with_agent(chat_req: models.ChatRequest, request: Request, db: Session = Depends(database.get_db)):
    user_id = get_current_user_id(request)
    user = db.query(database.User).filter(database.User.id == user_id).first() if user_id else None

    # Get events for Context (Last 4 weeks up to this week for context)
    now = datetime.utcnow()
    # Simple proxy: fetch past 30 days of events as context for the agent
    time_min = (now - timedelta(days=30)).isoformat() + "Z"
    time_max = (now + timedelta(days=7)).isoformat() + "Z"

    if user and user.refresh_token:
        creds = google.get_credentials_for_user(user)
        events_context = google.fetch_calendar_events(creds, time_min, time_max)
    else:
        # Mock Context
        events_context = google.get_mock_events(now.strftime("%Y-%m-%d"), days_offset=-30)
    
    response_text = agent.process_chat(chat_req.message, events_context)
    return models.ChatResponse(reply=response_text)
