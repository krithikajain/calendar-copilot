def classify_event(title: str, attendees: int, location: str):
    title_lower = title.lower() if title else ""
    
    # Simple rule-based classification based on MVP requirements
    if attendees >= 2:
        category = "Meeting"
        color = "bg-blue-100 text-blue-800 border-blue-200"
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

def compute_time_stats(events):
    import datetime
    
    totals = {
        "Meeting": 0, "Fitness": 0, "Break": 0, "Travel": 0, "Focus": 0, "Uncategorized": 0
    }
    
    for e in events:
        try:
            start = datetime.datetime.fromisoformat(e["start"].replace("Z", "+00:00"))
            end = datetime.datetime.fromisoformat(e["end"].replace("Z", "+00:00"))
            
            duration_hours = (end - start).total_seconds() / 3600.0
            cat = e.get("category", "Uncategorized")
            if cat in totals:
                totals[cat] += duration_hours
        except:
            pass
            
    return totals

def generate_reduce_meetings_suggestions(events, stats):
    hours = stats.get("Meeting", 0)
    suggestions = [
        f"You spent {hours:.1f} hours in meetings during this timeframe.",
        "Consider cutting regular syncs by 15 minutes (e.g. 45m instead of 1h).",
        "Try to batch your meetings into 2 specific days to free up blocks of deep work.",
        "Review your recurring meetings and decline those where your active participation isn't required."
    ]
    return suggestions

def generate_protect_mornings_suggestions(events):
    import datetime
    morning_meetings = 0
    
    for e in events:
        if e.get("category") == "Meeting":
            try:
                start = datetime.datetime.fromisoformat(e["start"].replace("Z", "+00:00"))
                # Check if it starts between 6 AM and 10 AM
                if start.hour >= 6 and start.hour < 10:
                    morning_meetings += 1
            except:
                pass
                
    suggestions = [
        f"I detected {morning_meetings} meetings scheduled before 10 AM.",
        "Strategy 1: Block out 8:00 AM - 10:00 AM on Monday, Wednesday, and Friday with a recurring 'Focus' event.",
        "Strategy 2: Add your Gym/Workout routine to your primary calendar specifically in the early morning to deter others from booking.",
        "Strategy 3: Set your Google Calendar working hours to start at 10:00 AM."
    ]
    return suggestions
