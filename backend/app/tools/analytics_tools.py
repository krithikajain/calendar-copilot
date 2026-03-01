import datetime

def compute_time_stats(events):
    totals = {
        "Meeting": 0.0, "Fitness": 0.0, "Break": 0.0, "Travel": 0.0, "Focus": 0.0, "Uncategorized": 0.0
    }
    
    for e in events:
        try:
            start = datetime.datetime.fromisoformat(e["start"].replace("Z", "+00:00"))
            end = datetime.datetime.fromisoformat(e["end"].replace("Z", "+00:00"))
            
            duration_hours = (end - start).total_seconds() / 3600.0
            cat = e.get("category", "Uncategorized")
            
            if cat == "Shared":
                cat = "Meeting"
                
            if cat in totals:
                totals[cat] += duration_hours
        except:
            pass
            
    return totals

def compute_meeting_patterns(events):
    # Returns meeting_count, avg_meeting_mins, busiest_day
    meeting_count = 0
    total_mins = 0
    day_counts = {}
    
    for e in events:
        cat = e.get("category", "Uncategorized")
        if cat == "Meeting" or cat == "Shared":
            meeting_count += 1
            try:
                start = datetime.datetime.fromisoformat(e["start"].replace("Z", "+00:00"))
                end = datetime.datetime.fromisoformat(e["end"].replace("Z", "+00:00"))
                mins = (end - start).total_seconds() / 60.0
                total_mins += mins
                
                day_str = start.strftime("%A")
                day_counts[day_str] = day_counts.get(day_str, 0) + 1
            except:
                pass
                
    avg_mins = (total_mins / meeting_count) if meeting_count > 0 else 0
    busiest_day = max(day_counts.items(), key=lambda x: x[1])[0] if day_counts else "None"
    
    return {
        "meeting_count": meeting_count,
        "avg_meeting_mins": avg_mins,
        "busiest_day": busiest_day
    }

def recommend_reduce_meetings(stats, patterns):
    hours = stats.get("Meeting", 0.0)
    suggestions = [
        f"You have spent {hours:.1f} hours across {patterns.get('meeting_count', 0)} meetings."
    ]
    if patterns.get("busiest_day") != "None":
        suggestions.append(f"Your busiest day for meetings is {patterns.get('busiest_day')}.")
        suggestions.append(f"Try to consolidate your meetings onto {patterns.get('busiest_day')} to free up other days for deep work.")
        
    suggestions.extend([
        "Consider cutting regular syncs by 15 minutes (e.g. 45m instead of 1h).",
        "Review your recurring meetings and decline those where your active participation isn't required."
    ])
    return suggestions
