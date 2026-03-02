import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import datetime
import time

# Simple in-memory cache for user metadata (TTL: 6 hours)
USER_METADATA_CACHE = {}
CACHE_TTL = 60 * 60 * 6

def get_cached_metadata(user_id: str):
    if user_id in USER_METADATA_CACHE:
        cache_data = USER_METADATA_CACHE[user_id]
        if time.time() - cache_data['timestamp'] < CACHE_TTL:
            return cache_data['data']
    return None

def set_cached_metadata(user_id: str, data: dict):
    USER_METADATA_CACHE[user_id] = {
        'timestamp': time.time(),
        'data': data
    }

SCOPES = [
    'openid', 
    'https://www.googleapis.com/auth/userinfo.email', 
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
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

def has_write_scope(scopes_str: str) -> bool:
    if not scopes_str: return False
    return 'https://www.googleapis.com/auth/calendar.events' in scopes_str

def insert_event(creds, event_data: dict, calendar_id: str = "primary"):
    service = build('calendar', 'v3', credentials=creds)
    
    body = {
        "summary": event_data.get("title", "New Event"),
        "start": {
            "dateTime": event_data["start"],
            "timeZone": event_data.get("timeZone", "UTC")
        },
        "end": {
            "dateTime": event_data["end"],
            "timeZone": event_data.get("timeZone", "UTC")
        }
    }
    
    if "location" in event_data and event_data["location"]:
        body["location"] = event_data["location"]
        
    if "notes" in event_data and event_data["notes"]:
        body["description"] = event_data["notes"]
        
    if "attendees" in event_data and event_data["attendees"]:
        # expecting a list of email strings or list of dicts with email
        attendees_list = []
        for att in event_data["attendees"]:
            if isinstance(att, str):
                attendees_list.append({"email": att.strip()})
            elif isinstance(att, dict) and "email" in att:
                attendees_list.append(att)
        if attendees_list:
            body["attendees"] = attendees_list
            body["sendUpdates"] = "all"
            
    res = service.events().insert(calendarId=calendar_id, body=body).execute()
    return {
        "id": res.get("id"),
        "htmlLink": res.get("htmlLink"),
        "start": res["start"].get("dateTime", res["start"].get("date")),
        "end": res["end"].get("dateTime", res["end"].get("date")),
        "summary": res.get("summary")
    }

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

def get_events(creds, time_min, time_max, google_user_id: str = "default"):
    if creds.token == "mock":
        events = get_mock_events(time_min[:10])
        filtered = []
        for e in events:
            if time_min <= e["start"] and e["start"] < time_max:
                filtered.append(e)
        return filtered
        
    service = build('calendar', 'v3', credentials=creds)
    
    # Check cache first
    meta = get_cached_metadata(google_user_id)
    if not meta:
        try:
            colors_result = service.colors().get().execute()
            colors = {
                "event": colors_result.get("event", {}),
                "calendar": colors_result.get("calendar", {})
            }
        except Exception:
            colors = {"event": {}, "calendar": {}}
            
        try:
            cals_result = service.calendarList().list().execute()
            cals_raw = cals_result.get("items", [])
        except Exception:
            cals_raw = []
            
        cals_map = {}
        for c in cals_raw:
            cals_map[c["id"]] = {
                "name": c.get("summary", "Unknown"),
                "colorId": c.get("colorId"),
                "accessRole": c.get("accessRole", "reader"),
                "primary": c.get("primary", False)
            }
            
        meta = {"colors": colors, "calendars": cals_map}
        set_cached_metadata(google_user_id, meta)
        
    colors = meta["colors"]
    calendars_map = meta["calendars"]
    
    normalized_events = []
    seen_events = set()
    
    for cal_id, cal_info in calendars_map.items():
        try:
            events_result = service.events().list(
                calendarId=cal_id, 
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            for e in events:
                if 'start' not in e or 'dateTime' not in e['start']:
                    continue # skip all-day events for timeline view
                    
                title = e.get('summary', 'Busy').strip()
                if not title: title = 'Busy'
                    
                start = e['start'].get('dateTime', e['start'].get('date'))
                end = e['end'].get('dateTime', e['end'].get('date'))
                attendees = len(e.get('attendees', []))
                location = e.get('location')
                
                is_primary = cal_info.get('primary', False)
                is_shared = not is_primary or cal_info.get("accessRole") != "owner"
                
                has_meet_link = bool(e.get('hangoutLink'))
                desc = e.get('description', '').lower()
                loc = (e.get('location') or '').lower()
                title_lower = title.lower()
                
                if not has_meet_link and any(domain in desc or domain in loc or domain in title_lower for domain in ['zoom.us', 'teams.microsoft', 'teams.live', 'meet.google']):
                    has_meet_link = True
                
                category, tagColor = classify_event(title, attendees, location, is_shared, has_meet_link)
                
                meet_link = e.get('hangoutLink')
                if not meet_link and 'zoom.us' in loc: meet_link = e.get('location')
                elif not meet_link and 'teams.m' in loc: meet_link = e.get('location')
                
                # Resolving Google Colors exactly as per Replica reqs
                event_color_id = e.get('colorId')
                calendar_color_id = cal_info.get('colorId')
                
                resolved_colors = None
                if event_color_id and event_color_id in colors.get("event", {}):
                    resolved_colors = colors["event"][event_color_id]
                elif calendar_color_id and calendar_color_id in colors.get("calendar", {}):
                    resolved_colors = colors["calendar"][calendar_color_id]
                    
                # Initials logic
                cal_name = cal_info.get("name", "Unknown")
                words = [w for w in cal_name.replace('@', ' ').replace('.', ' ').split() if w.strip()]
                if not words: initials = "C"
                elif len(words) == 1: initials = words[0][:2].upper()
                else: initials = (words[0][0] + words[1][0]).upper()
                
                dedup_key = (title, start, end)
                if dedup_key in seen_events:
                    continue
                seen_events.add(dedup_key)
                
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
                    "calendar": {
                        "id": cal_id,
                        "name": cal_name,
                        "initials": initials,
                        "isShared": is_shared,
                        "accessRole": cal_info.get("accessRole")
                    },
                    "google": {
                        "eventColorId": event_color_id,
                        "calendarColorId": calendar_color_id,
                        "resolvedColors": resolved_colors
                    },
                    "meetLink": meet_link
                })
        except Exception as e:
            print(f"Error fetching events for calendar {cal_id}: {e}")
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
        
        cat, color = classify_event(title, attendees, None, False, False)
        events.append({
            "id": f"mock_{id_suffix}",
            "title": title,
            "start": start,
            "end": end,
            "attendeesCount": attendees,
            "location": "Remote",
            "category": cat,
            "tagColor": color,
            "meetLink": None,
            "googleColorId": None
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
    
    # Filter bounds
    try:
        if "T" in start_date_str:
            tmin_dt = datetime.datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
    except:
        pass
        
    return events
def classify_event(title: str, attendees: int, location: str, is_shared: bool = False, has_meet_link: bool = False):
    # We will let shared events pass through the normal classification logic
    # but give them a default "Shared" category if they don't hit the "Meeting" criteria,
    # or just treat them as "Shared" but group them with Meetings in stats.
    # Actually, user wants them considered as meetings.
    if is_shared:
        category = "Shared"
        
    title_lower = title.lower() if title else ""
    loc_lower = location.lower() if location else ""
    
    # Simple rule-based classification
    is_meeting = has_meet_link or attendees >= 2
    is_meeting_kw = any(kw in title_lower or kw in loc_lower for kw in ["meeting", "sync", "call", "busy", "interview", "block", "1:1", "meet"])
    
    if is_meeting or is_meeting_kw or is_shared:
        category = "Shared" if is_shared else "Meeting"
        color = "" if is_shared else "bg-blue-100 text-blue-800 border-blue-200"
    elif any(kw in title_lower for kw in ["gym", "workout", "run", "yoga", "fitness"]):
        category = "Fitness"
        color = "bg-green-100 text-green-800 border-green-200"
    elif any(kw in title_lower for kw in ["lunch", "break", "walk", "coffee"]):
        category = "Break"
        color = "bg-orange-100 text-orange-800 border-orange-200"
    elif any(kw in title_lower for kw in ["commute", "uber", "flight", "drive", "travel"]):
        category = "Travel"
        color = "bg-yellow-100 text-yellow-800 border-yellow-200"
    elif any(kw in title_lower for kw in ["focus", "deep work", "coding", "writing"]):
        category = "Focus"
        color = "bg-purple-100 text-purple-800 border-purple-200"
    else:
        category = "Uncategorized"
        color = "bg-gray-100 text-gray-800 border-gray-200"
        
    return category, color

