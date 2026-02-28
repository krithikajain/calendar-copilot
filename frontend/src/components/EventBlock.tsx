import { CalendarEvent } from "../types";
import { cn } from "../lib/utils";
import { format, parseISO } from "date-fns";
import { getEventTheme, RADIUS } from "../lib/theme";

interface Props {
    event: CalendarEvent;
    leftOffset: number;
    widthPercent: number;
    startHourOffset: number;
    durationHours: number;
}

export function EventBlock({ event, leftOffset, widthPercent, startHourOffset, durationHours }: Props) {
    const topPercent = (startHourOffset / 16) * 100;
    const heightPercent = (durationHours / 16) * 100;

    const startTime = format(parseISO(event.start), "h:mm a");
    const endTime = format(parseISO(event.end), "h:mm a");
    const isShort = durationHours < 0.75;

    return (
        <div
            className={cn(
                "absolute p-3 text-sm overflow-hidden border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:z-30 cursor-pointer flex flex-col justify-start",
                RADIUS.event,
                getEventTheme(event.category)
            )}
            style={{
                top: `${topPercent}%`,
                height: `${heightPercent}%`,
                left: `${leftOffset}%`,
                width: `${widthPercent}%`,
                minHeight: "28px",
            }}
            title={`${event.title} (${startTime} - ${endTime})`}
        >
            <div className="font-semibold truncate tracking-tight">{event.title}</div>
            {!isShort && (
                <div className="text-xs opacity-80 mt-0.5 truncate font-medium">
                    {startTime} - {endTime}
                </div>
            )}
        </div>
    );
}
