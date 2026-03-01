import datetime
import zoneinfo

def compute_free_slots(events, start_iso: str, end_iso: str, constraints: dict, duration_minutes: int, tz_str: str = "America/New_York"):
    tz = zoneinfo.ZoneInfo(tz_str)
    start_dt = datetime.datetime.fromisoformat(start_iso).astimezone(tz)
    end_dt = datetime.datetime.fromisoformat(end_iso).astimezone(tz)
    
    # Defaults
    window_start_hour = constraints.get("time_window_start_hour") or 9
    window_end_hour = constraints.get("time_window_end_hour") or 17
    days_of_week = constraints.get("days_of_week") or ["Mon", "Tue", "Wed", "Thu", "Fri"]
    
    days_to_check = []
    curr = start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    end_curr = end_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    
    while curr <= end_curr:
        dow_str = curr.strftime("%a")
        if dow_str in days_of_week:
            day_start = curr.replace(hour=window_start_hour)
            day_end = curr.replace(hour=window_end_hour)
            
            if day_start < start_dt:
                day_start = start_dt
                
            if day_start < day_end:
                days_to_check.append({
                    "date": curr.strftime("%Y-%m-%d"),
                    "start": day_start,
                    "end": day_end,
                    "free_slots": [[day_start, day_end]]
                })
        curr += datetime.timedelta(days=1)
        
    parsed_events = []
    for e in events:
        try:
            e_start = datetime.datetime.fromisoformat(e['start'].replace('Z', '+00:00')).astimezone(tz)
            e_end = datetime.datetime.fromisoformat(e['end'].replace('Z', '+00:00')).astimezone(tz)
            parsed_events.append((e_start, e_end))
        except:
            pass
            
    for day in days_to_check:
        for ev_start, ev_end in parsed_events:
            if ev_start < day["end"] and ev_end > day["start"]:
                new_slots = []
                for f_start, f_end in day["free_slots"]:
                    if ev_end <= f_start or ev_start >= f_end:
                        new_slots.append([f_start, f_end])
                    else:
                        if f_start < ev_start:
                            new_slots.append([f_start, ev_start])
                        if ev_end < f_end:
                            new_slots.append([ev_end, f_end])
                day["free_slots"] = new_slots
                
    min_delta = datetime.timedelta(minutes=duration_minutes)
    valid_slots = []
    for day in days_to_check:
        for f_start, f_end in day["free_slots"]:
            current_f_start = f_start
            while (current_f_start + min_delta) <= f_end:
                valid_slots.append({
                    "start": current_f_start.isoformat(),
                    "end": (current_f_start + min_delta).isoformat(),
                    "date": day["date"]
                })
                current_f_start += datetime.timedelta(minutes=30)
                
    if valid_slots:
        # Pick 3 options perfectly
        options = pick_slot_options(valid_slots, 3)
        return {"slots": options, "slots_found": True}
    
    # If no free slots found in the strict window, relax constraints (just find any time)
    relaxed_slots = _compute_relaxed_slots(start_dt, end_dt, parsed_events, duration_minutes)
    options = pick_slot_options(relaxed_slots, 3)
    return {"slots": options, "slots_found": False}

def _compute_relaxed_slots(start_dt, end_dt, parsed_events, duration_minutes):
    days_to_check = []
    curr = start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    end_curr = end_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    
    while curr <= end_curr:
        # Check standard 8am to 6pm and try to find gaps
        day_start = curr.replace(hour=8)
        day_end = curr.replace(hour=18)
        if day_start < start_dt:
            day_start = start_dt
        if day_start < day_end:
            days_to_check.append({
                "date": curr.strftime("%Y-%m-%d"),
                "start": day_start,
                "end": day_end,
                "free_slots": [[day_start, day_end]]
            })
        curr += datetime.timedelta(days=1)
        
    for day in days_to_check:
        for ev_start, ev_end in parsed_events:
            if ev_start < day["end"] and ev_end > day["start"]:
                new_slots = []
                for f_start, f_end in day["free_slots"]:
                    if ev_end <= f_start or ev_start >= f_end:
                        new_slots.append([f_start, f_end])
                    else:
                        if f_start < ev_start:
                            new_slots.append([f_start, ev_start])
                        if ev_end < f_end:
                            new_slots.append([ev_end, f_end])
                day["free_slots"] = new_slots
                
    min_delta = datetime.timedelta(minutes=duration_minutes)
    valid_slots = []
    for day in days_to_check:
        for f_start, f_end in day["free_slots"]:
            if (f_end - f_start) >= min_delta:
                valid_slots.append({
                    "start": f_start.isoformat(),
                    "end": (f_start + min_delta).isoformat(),
                    "date": day["date"]
                })
    return valid_slots

def pick_slot_options(free_blocks, max_options=3):
    if not free_blocks:
        return []
    options = []
    seen_dates = set()
    for b in free_blocks:
        if b["date"] not in seen_dates:
            options.append(b)
            seen_dates.add(b["date"])
            if len(options) == max_options:
                return options
    for b in free_blocks:
        if b not in options:
            options.append(b)
            if len(options) == max_options:
                break
    options.sort(key=lambda x: x["start"])
    return options
