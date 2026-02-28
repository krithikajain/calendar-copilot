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
    const isShort = durationHours <= 0.5;

    return (
        <div
            className={cn(
                "absolute px-2 py-1 text-sm overflow-hidden border-l-4 transition-all hover:shadow-md hover:z-30 cursor-pointer flex flex-col justify-start",
                RADIUS.event,
                getEventTheme(event.category)
            )}
            style={{
                top: `${topPercent}%`,
                height: `calc(${heightPercent}% - 2px)`,
                left: `${leftOffset}%`,
                width: `calc(${widthPercent}% - 4px)`,
                minHeight: "22px",
            }}
            title={`${event.title} (${startTime} - ${endTime})`}
        >
            <div className="font-semibold text-[11px] leading-tight truncate">{event.title}</div>
            {!isShort && (
                <div className="text-[10px] opacity-90 mt-0.5 truncate font-medium leading-[1.1]">
                    {startTime} - {endTime}
                </div>
            )}
        </div>
    );
}
