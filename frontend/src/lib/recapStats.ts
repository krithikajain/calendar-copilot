import { CalendarEvent } from '../types';
import { differenceInMinutes, getDay, isAfter, isBefore, setHours, setMinutes } from 'date-fns';

export interface RecapStats {
    totalMeetingHours: string;
    meetingPercentage: string;
    busiestDay: string;
    busiestDayHours: string;
    deepWorkCount: number;
    longestDeepWork: string;
    totalFreeHours: string;
}

export function computeRecapStats(events: CalendarEvent[], weekStartStr: string): RecapStats {
    let totalMeetingMinutes = 0;
    const dailyMeetingMinutes: Record<string, number> = {};
    const dailyEvents: Record<number, { start: Date, end: Date }[]> = {
        1: [], 2: [], 3: [], 4: [], 5: [] // Mon - Fri
    };

    const isMeeting = (event: CalendarEvent) => {
        if (!event.start.includes('T')) return false; // Exclude all-day events (no time component)
        const attendeesCount = event.attendeesCount || 0;
        const titleMatch = event.title?.toLowerCase().match(/meet|sync|1:1|standup|catch up/i);
        // Simple heuristic: if it has multiple attendees or title sounds like a meeting
        return attendeesCount > 0 || titleMatch;
    };

    events.forEach(event => {
        if (!event.start || !event.end) return;
        const start = new Date(event.start);
        const end = new Date(event.end);
        const dayOfWeek = getDay(start); // 0 = Sun, 1 = Mon ... 6 = Sat

        if (isMeeting(event)) {
            const duration = differenceInMinutes(end, start);
            totalMeetingMinutes += duration;
            const dayName = start.toLocaleDateString('en-US', { weekday: 'long' });
            dailyMeetingMinutes[dayName] = (dailyMeetingMinutes[dayName] || 0) + duration;
        }

        // Only care about Mon-Fri for deep work and free time
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            dailyEvents[dayOfWeek].push({ start, end });
        }
    });

    // Sort events per day
    for (let day = 1; day <= 5; day++) {
        dailyEvents[day].sort((a, b) => a.start.getTime() - b.start.getTime());
    }

    // Busiest Day
    let busiestDayName = "None";
    let maxMinutes = 0;
    for (const [day, mins] of Object.entries(dailyMeetingMinutes)) {
        if (mins > maxMinutes) {
            maxMinutes = mins;
            busiestDayName = day;
        }
    }

    // Deep Work and Free Time
    // Working hours 9am - 6pm (9 hrs/day) = 540 mins/day * 5 days = 2700 mins total work week
    let deepWorkBlocks = 0;
    let maxDeepWorkMinutes = 0;
    let totalFreeMinutes = 0;

    const baseDateString = weekStartStr ? weekStartStr : new Date().toISOString().split('T')[0];
    const weekStartDate = new Date(baseDateString + 'T00:00:00'); // Local midnight of Sunday (if weekStartsOn: 0)

    for (let i = 1; i <= 5; i++) {
        const currentDayDate = new Date(weekStartDate);
        currentDayDate.setDate(currentDayDate.getDate() + i); // 1 = Mon, 5 = Fri

        const workStart = setMinutes(setHours(currentDayDate, 9), 0);
        const workEnd = setMinutes(setHours(currentDayDate, 18), 0);

        let currentTime = workStart;
        const dayEvents = dailyEvents[i] || [];

        for (const ev of dayEvents) {
            if (isAfter(ev.end, workStart) && isBefore(ev.start, workEnd)) {
                // There is a gap from currentTime to ev.start
                const gapStart = isAfter(currentTime, workStart) ? currentTime : workStart;
                const gapEnd = isBefore(ev.start, workEnd) ? ev.start : workEnd;

                if (isBefore(gapStart, gapEnd)) {
                    const gapMins = differenceInMinutes(gapEnd, gapStart);
                    totalFreeMinutes += gapMins;
                    if (gapMins >= 60) {
                        deepWorkBlocks++;
                        if (gapMins > maxDeepWorkMinutes) maxDeepWorkMinutes = gapMins;
                    }
                }

                if (isAfter(ev.end, currentTime)) {
                    currentTime = ev.end;
                }
            }
        }

        // Gap after last event till end of work day
        if (isBefore(currentTime, workEnd)) {
            const gapMins = differenceInMinutes(workEnd, currentTime);
            totalFreeMinutes += gapMins;
            if (gapMins >= 60) {
                deepWorkBlocks++;
                if (gapMins > maxDeepWorkMinutes) maxDeepWorkMinutes = gapMins;
            }
        }
    }

    const totalMeetingHours = (totalMeetingMinutes / 60).toFixed(1);
    const meetingPercentage = Math.round((totalMeetingMinutes / 2700) * 100) || 0;
    const busiestDayHours = (maxMinutes / 60).toFixed(1);

    const maxDeepHr = Math.floor(maxDeepWorkMinutes / 60);
    const maxDeepMin = maxDeepWorkMinutes % 60;
    const longestDeepWork = maxDeepHr > 0 ? `${maxDeepHr}h ${maxDeepMin > 0 ? maxDeepMin + 'm' : ''}` : `${maxDeepMin}m`;
    const freeHours = (totalFreeMinutes / 60).toFixed(1);

    return {
        totalMeetingHours: totalMeetingHours,
        meetingPercentage: `${meetingPercentage}%`,
        busiestDay: busiestDayName,
        busiestDayHours: busiestDayHours,
        deepWorkCount: deepWorkBlocks,
        longestDeepWork: maxDeepWorkMinutes > 0 ? longestDeepWork.trim() : "0m",
        totalFreeHours: freeHours
    };
}
