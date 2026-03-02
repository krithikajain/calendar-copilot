from typing import Dict, Any
from .schemas import Plan
import app.tools.calendar_tools as cal_tools
import app.tools.scheduling_tools as sched_tools
import app.tools.analytics_tools as analytics_tools

class ToolRunner:
    def __init__(self, google_creds):
        self.google_creds = google_creds
        
    def run(self, plan: Plan, tz_str: str) -> Dict[str, Any]:
        results = {}
        events_cache = []
        
        # Enforce limits
        calls = plan.tool_calls[:6]
        
        for call in calls:
            if call.name == "get_events":
                if plan.time_range and plan.time_range.start_iso and plan.time_range.end_iso:
                    tmin = plan.time_range.start_iso
                    tmax = plan.time_range.end_iso
                else:
                     import datetime, zoneinfo
                     now = datetime.datetime.now(zoneinfo.ZoneInfo(tz_str))
                     tmin = now.isoformat()
                     tmax = (now + datetime.timedelta(days=14)).isoformat()
                     
                events = cal_tools.get_events(self.google_creds, tmin, tmax)
                events_cache = events[:200]
                
                if plan.intent in ["day_brief", "week_brief", "unknown"]:
                    results["events"] = [
                        {
                            "title": e.get("title", "Untitled"),
                            "start": e.get("start"),
                            "end": e.get("end"),
                            "category": e.get("category", "Uncategorized")
                        } for e in events_cache[:40]
                    ]
                else:
                    results["events"] = f"Fetched {len(events_cache)} events."
                
            elif call.name == "compute_free_slots":
                c = plan.constraints.model_dump() if plan.constraints else {}
                duration = plan.duration_minutes or 30
                if plan.time_range and plan.time_range.start_iso and plan.time_range.end_iso:
                    ts, te = plan.time_range.start_iso, plan.time_range.end_iso
                else:
                     import datetime, zoneinfo
                     now = datetime.datetime.now(zoneinfo.ZoneInfo(tz_str))
                     ts = now.isoformat()
                     te = (now + datetime.timedelta(days=7)).isoformat()
                     
                slot_data = sched_tools.compute_free_slots(events_cache, ts, te, c, duration, tz_str)
                results["slot_options"] = slot_data["slots"]
                results["slots_found"] = slot_data["slots_found"]
                
                if not slot_data["slots_found"]:
                    # Inject nearest alternatives explicitly
                    results["nearest_alternatives"] = "No exact match found in constraints. Slots provided are adjacent recommendations."
                
            elif call.name == "compute_time_stats":
                stats = analytics_tools.compute_time_stats(events_cache)
                results["stats"] = stats
                
            elif call.name == "compute_meeting_patterns":
                patterns = analytics_tools.compute_meeting_patterns(events_cache)
                results["meeting_patterns"] = patterns
                
            elif call.name == "recommend_reduce_meetings":
                stats = results.get("stats", {})
                patterns = results.get("meeting_patterns", {})
                recs = analytics_tools.recommend_reduce_meetings(stats, patterns)
                results["recommendations"] = recs
                
        return results
