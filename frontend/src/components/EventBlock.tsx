import { CalendarEvent } from "../types";
import { cn } from "../lib/utils";
import { format, parseISO } from "date-fns";

interface Props {
    event: CalendarEvent;
    leftOffset: number;
    widthPercent: number;
    startHourOffset: number;
    durationHours: number;
}

export function EventBlock({ event, leftOffset, widthPercent, startHourOffset, durationHours }: Props) {
    const topPercent = (startHourOffset / 16) * 100; // 16 hours total (6AM - 10PM)
    const heightPercent = (durationHours / 16) * 100;

    const startTime = format(parseISO(event.start), "h:mm a");
    const endTime = format(parseISO(event.end), "h:mm a");
    const isShort = durationHours < 0.75;

    return (
        <div
            className={cn(
                "absolute rounded-md p-2 text-sm overflow-hidden border shadow-sm transition-all hover:shadow-md hover:z-30 cursor-pointer flex flex-col justify-start",
                event.tagColor || "bg-gray-100 text-gray-800 border-gray-200"
            )}
            style={{
                top: `${topPercent}%`,
                height: `${heightPercent}%`,
                left: `${leftOffset}%`,
                width: `${widthPercent}%`,
                minHeight: "24px",
            }}
            title={`${event.title} (${startTime} - ${endTime})`}
        >
            <div className="font-semibold truncate tracking-tight">{event.title}</div>
            {!isShort && (
                <div className="text-xs opacity-80 mt-1 truncate font-medium">
                    {startTime} - {endTime}
                </div>
            )}
        </div>
    );
}
