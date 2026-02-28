import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import datetime
from .tools import classify_event

SCOPES = [
    'openid', 
    'https://www.googleapis.com/auth/userinfo.email', 
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar.readonly'
]

def get_flow():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback")

    if not client_id or not client_secret:
        # Returning dummy flow to avoid crash if keys not provided
        return None
        
    client_config = {
        "web": {
            "client_id": client_id,
            "project_id": "calendar-copilot",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": client_secret,
            "redirect_uris": [redirect_uri]
        }
    }
    
    flow = Flow.from_client_config(
        client_config, 
        scopes=SCOPES, 
        autogenerate_code_verifier=False
    )
    flow.redirect_uri = redirect_uri
    return flow

def get_authorization_url():
    flow = get_flow()
    if not flow:
         # Fallback mock URL if no credentials set to not break UI completely
         return "/auth/callback?code=mock_code_for_demo", "state"
    auth_url, state = flow.authorization_url(access_type='offline', include_granted_scopes='true', prompt='consent')
    return auth_url, state

def fetch_token_and_user_info(code: str):
    if code == "mock_code_for_demo":
        from google.oauth2.credentials import Credentials
        creds = Credentials(token="mock", refresh_token="mock", token_uri="mock", client_id="mock", client_secret="mock")
        return {"id": "mock_123", "email": "demo@example.com", "name": "Demo User"}, creds
        
    flow = get_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    
    # Fetch user info
    session = flow.authorized_session()
    user_info = session.get('https://www.googleapis.com/userinfo/v2/me').json()
    return user_info, creds

def get_credentials_for_user(user):
    if user.access_token == "mock":
       return Credentials(token="mock", refresh_token="mock", token_uri="mock", client_id="mock", client_secret="mock")
       
    return Credentials(
        token=user.access_token,
        refresh_token=user.refresh_token,
        token_uri=user.token_uri,
        client_id=user.client_id,
        client_secret=user.client_secret,
        scopes=user.scopes.split(",") if user.scopes else SCOPES
    )

def fetch_calendar_events(creds, time_min, time_max):
    if creds.token == "mock":
        return get_mock_events(time_min[:10])
        
    service = build('calendar', 'v3', credentials=creds)
    
    # Fetch all calendars the user has access to
    calendars_result = service.calendarList().list().execute()
    calendars = calendars_result.get('items', [])
    
    normalized_events = []
    
    for calendar in calendars:
        try:
            events_result = service.events().list(
                calendarId=calendar['id'], 
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            for e in events:
                if 'start' not in e or 'dateTime' not in e['start']:
                    continue # skip all-day events for timeline view
                    
                # Handle shared private events that hide summaries
                title = e.get('summary', 'Busy').strip()
                if not title:
                    title = 'Busy'
                    
                start = e['start'].get('dateTime', e['start'].get('date'))
                end = e['end'].get('dateTime', e['end'].get('date'))
                attendees = len(e.get('attendees', []))
                location = e.get('location')
                
                category, tagColor = classify_event(title, attendees, location)
                
                normalized_events.append({
                    "id": e.get('id'),
                    "title": title,
                    "start": start,
                    "end": end,
                    "attendeesCount": attendees,
                    "location": location,
                    "organizer": e.get('organizer', {}).get('displayName'),
                    "htmlLink": e.get('htmlLink'),
                    "category": category,
                    "tagColor": tagColor,
                    "calendarName": calendar.get('summary', 'Unknown')
                })
        except Exception as e:
            print(f"Error fetching events for calendar {calendar.get('id')}: {e}")
            continue

    # Sort the combined list of events by start time
    normalized_events.sort(key=lambda x: x['start'])
        
    return normalized_events

def get_mock_events(start_date_str, days_offset=0):
    """Provides a realistic set of mock events for the demo."""
    import datetime
    
    # parse the input
    try:
        base_date = datetime.datetime.strptime(start_date_str, "%Y-%m-%d")
    except ValueError:
        base_date = datetime.datetime.now()
        
    # start from Monday of that week
    monday = base_date - datetime.timedelta(days=base_date.weekday())
    
    events = []
    
    # Routine creation script
    def add_event(id_suffix, title, day_offset, start_hour, end_hour, attendees=1):
        dt = monday + datetime.timedelta(days=day_offset)
        start = dt.replace(hour=int(start_hour), minute=int((start_hour % 1) * 60)).isoformat() + "Z"
        end = dt.replace(hour=int(end_hour), minute=int((end_hour % 1) * 60)).isoformat() + "Z"
        
        cat, color = classify_event(title, attendees, None)
        events.append({
            "id": f"mock_{id_suffix}",
            "title": title,
            "start": start,
            "end": end,
            "attendeesCount": attendees,
            "location": "Remote",
            "category": cat,
            "tagColor": color
        })

    # Monday (0)
    add_event("mon1", "Morning Run", 0, 7.0, 8.0)
    add_event("mon2", "Weekly Sync", 0, 10.0, 11.0, 5)
    add_event("mon3", "Deep Work: Coding", 0, 13.0, 15.0)
    add_event("mon4", "1:1 with Alex", 0, 15.5, 16.0, 2)
    
    # Tuesday (1)
    add_event("tue1", "Gym Session", 1, 7.5, 8.5)
    add_event("tue2", "Project Planning", 1, 9.5, 11.5, 3)
    add_event("tue3", "Lunch Break", 1, 12.0, 13.0)
    add_event("tue4", "Focus Time", 1, 14.0, 17.0)

    # Wednesday (2) - High meeting day
    add_event("wed1", "Yoga", 2, 7.0, 8.0)
    add_event("wed2", "Design Review", 2, 10.0, 11.0, 4)
    add_event("wed3", "All Hands", 2, 11.0, 12.0, 50)
    add_event("wed4", "Quick catchup", 2, 13.0, 13.5, 2)
    add_event("wed5", "Client Call", 2, 14.0, 15.0, 6)
    add_event("wed6", "Architecture Sync", 2, 16.0, 17.0, 3)
    
    # Thursday (3)
    add_event("thu1", "Morning Run", 3, 7.0, 8.0)
    add_event("thu2", "Deep Work: Coding", 3, 9.0, 12.0)
    add_event("thu3", "Lunch Break", 3, 12.0, 13.0)
    add_event("thu4", "Team Retrospective", 3, 15.0, 16.0, 8)
    
    # Friday (4)
    add_event("fri1", "Gym Session", 4, 7.5, 8.5)
    add_event("fri2", "Focus Time", 4, 10.0, 13.0)
    add_event("fri3", "Flight to SF", 4, 15.0, 19.0)
    
    return events
