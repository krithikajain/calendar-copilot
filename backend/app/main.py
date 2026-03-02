import os
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app import database, models
import app.tools.calendar_tools as calendar_tools
from app.agent.orchestrator import Orchestrator

from dotenv import load_dotenv
load_dotenv()

# Startup logic
print("--- STARTING APP ---")
try:
    database.init_db()
    print("Database initialized successfully.")
except Exception as e:
    print(f"WARNING: Database initialization failed: {e}")

app = FastAPI(title="Calendar Copilot MVP")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Calendar Copilot API is running"}

# Parse FRONTEND_URL to support comma-separated lists and remove trailing slashes
# We explicitly include your provided Vercel domain as a default fallback
raw_frontend_url = os.getenv("FRONTEND_URL", "https://calendar-copilot-20.vercel.app, http://localhost:5173")
origins = []

for url in raw_frontend_url.split(","):
    clean_url = url.strip().rstrip("/")
    if clean_url and clean_url not in origins:
        origins.append(clean_url)

print(f"CORS: Allowed origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# A simple in-memory session store for MVP to relate requests to the user ID
# In production, use JWT or proper session cookies.
SESSION_STORE = {}

def get_current_user_id(request: Request) -> int:
    session_id = None
    
    # Check Authorization header first (e.g. Bearer <token>)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        session_id = auth_header.split(" ")[1]
        
    # Fallback to cookie
    if not session_id:
        session_id = request.cookies.get("session_id")
        
    if not session_id or session_id not in SESSION_STORE:
        return None
    return SESSION_STORE[session_id]

@app.get("/auth/login")
def login():
    authorization_url, state = calendar_tools.get_authorization_url()
    return RedirectResponse(authorization_url)

@app.get("/auth/callback")
def auth_callback(request: Request, db: Session = Depends(database.get_db)):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code omitted.")
    
    user_info, creds = calendar_tools.fetch_token_and_user_info(code)
    
    # Store or update user in DB
    user = db.query(database.User).filter(database.User.google_id == user_info["id"]).first()
    if not user:
        user = database.User(google_id=user_info["id"], email=user_info.get("email"), name=user_info.get("name"))
        db.add(user)
    
    user.access_token = creds.token
    if creds.refresh_token:
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

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")[0].strip().rstrip("/")
    redirect_url = f"{frontend_url}/?session_id={session_id}"
    
    response = RedirectResponse(url=redirect_url)
    response.set_cookie(
        key="session_id", 
        value=session_id, 
        httponly=True, 
        max_age=86400*30, 
        samesite="none", 
        secure=True
    )
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
        return calendar_tools.get_mock_events(weekStart)
    
    # Fetch real events
    creds = calendar_tools.get_credentials_for_user(user)
    events = calendar_tools.get_events(creds, time_min, time_max)
    
    return events

@app.post("/api/events/create")
def create_event(req: models.CreateEventRequest, request: Request, db: Session = Depends(database.get_db)):
    user_id = get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    user = db.query(database.User).filter(database.User.id == user_id).first()
    if not user or not user.refresh_token:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    if not calendar_tools.has_write_scope(user.scopes):
        # We use a 403 to indicate missing scopes specifically
        return {"error": "missing_write_scope", "message": "Reconnect to enable write access."}, 403
        
    creds = calendar_tools.get_credentials_for_user(user)
    
    # Check if we need to refresh (creds.refresh handles this if we call an API, but we can also just call insert_event
    # and let the googleapiclient handle the refresh using refresh_token automatically, but we might want to save it)
    # The googleapiclient will automatically refresh the access token if needed, but it won't save it back to our DB.
    # For MVP, it's fine if the DB holds an old access token as long as the refresh token works.
    
    event_data = {
        "title": req.title,
        "start": req.start,
        "end": req.end,
        "attendees": req.attendees,
        "location": req.location,
        "notes": req.notes,
        "timeZone": req.timeZone
    }
    
    try:
        created_event = calendar_tools.insert_event(creds, event_data, calendar_id=req.calendarId)
        return created_event
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=models.ChatResponse)
def chat_with_agent(chat_req: models.ChatRequest, request: Request, db: Session = Depends(database.get_db)):
    user_id = get_current_user_id(request)
    user = db.query(database.User).filter(database.User.id == user_id).first() if user_id else None

    if user and user.refresh_token:
        creds = calendar_tools.get_credentials_for_user(user)
    else:
        # Mock class for creds if not logged in
        class MockCreds:
            token = "mock"
        creds = MockCreds()
    
    orchestrator = Orchestrator(creds)
    response_data = orchestrator.process_chat(chat_req.message, tz_str="America/New_York")
    
    return models.ChatResponse(**response_data)
