import { CalendarEvent } from "../types";
import { EventBlock } from "./EventBlock";
import { addDays, parseISO, isSameDay } from "date-fns";

interface Props {
    events: CalendarEvent[];
    weekStart: Date;
}

export function CalendarTimeline({ events, weekStart }: Props) {
    // Timeline from 6:00 AM to 11:00 PM (to see 10 PM slot fully)
    const START_HOUR = 6;
    const END_HOUR = 23;
    const TOTAL_HOURS = END_HOUR - START_HOUR;

    const hours = Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => i + START_HOUR);
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    // Determine positions of events
    const getEventStyleInfo = (event: CalendarEvent, dayIndex: number) => {
        try {
            const start = parseISO(event.start);
            const end = parseISO(event.end);

            const startHourExact = start.getHours() + (start.getMinutes() / 60);
            const endHourExact = end.getHours() + (end.getMinutes() / 60);

            // Filter out events outside our timeline bounds
            if (startHourExact >= END_HOUR || endHourExact <= START_HOUR) return null;

            const boundedStart = Math.max(START_HOUR, startHourExact);
            const boundedEnd = Math.min(END_HOUR, endHourExact);

            const durationHours = boundedEnd - boundedStart;
            const startHourOffset = boundedStart - START_HOUR;

            // Simple offset: Left is just the day column (0 to 6)
            const dayColumnWidth = 100 / 7;
            const leftOffset = dayIndex * dayColumnWidth;
            const widthPercent = dayColumnWidth * 0.95; // slight gap

            return { startHourOffset, durationHours, leftOffset: leftOffset + (dayColumnWidth * 0.025), widthPercent };
        } catch {
            return null;
        }
    };

    return (
        <div className="relative min-w-[700px] h-[1200px] bg-[#fdfdfd]">

            {/* Background Grid & Time Labels */}
            <div className="absolute inset-0 flex">
                {/* Time axis Left */}
                <div className="w-16 shrink-0 border-r border-gray-100 flex flex-col pt-4">
                    {hours.map((hour) => {
                        const display = hour % 12 === 0 ? 12 : hour % 12;
                        const ampm = hour < 12 || hour === 24 ? "AM" : "PM";
                        return (
                            <div
                                key={hour}
                                className="flex-1 relative border-b border-transparent"
                            >
                                {hour !== END_HOUR && (
                                    <span className="absolute -top-3 right-2 text-xs text-gray-400 font-medium">
                                        {display} {ampm}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Day Columns */}
                <div className="flex-1 flex pt-4 relative">
                    {days.map((day, i) => (
                        <div key={i} className="flex-1 border-r border-gray-100/60 relative">
                            {/* Horizontal hour lines for this column */}
                            {hours.map((hour) => (
                                <div key={hour} className="absolute w-full border-b border-gray-100" style={{ top: `${((hour - START_HOUR) / TOTAL_HOURS) * 100}%` }}></div>
                            ))}
                        </div>
                    ))}

                    {/* Overlay Events */}
                    <div className="absolute inset-0 pt-4">
                        {events.map((ev) => {
                            const evStart = parseISO(ev.start);
                            // Find which day column this event belongs to
                            const dayIndex = days.findIndex(d => isSameDay(d, evStart));
                            if (dayIndex === -1) return null;

                            const styleInfo = getEventStyleInfo(ev, dayIndex);
                            if (!styleInfo) return null;

                            return (
                                <EventBlock
                                    key={ev.id}
                                    event={ev}
                                    leftOffset={styleInfo.leftOffset}
                                    widthPercent={styleInfo.widthPercent}
                                    startHourOffset={styleInfo.startHourOffset}
                                    durationHours={styleInfo.durationHours}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
