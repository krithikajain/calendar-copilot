import { CalendarEvent } from "../types";
import { cn } from "../lib/utils";
import { format, parseISO } from "date-fns";
import { Video } from "lucide-react";
import { getEventTheme, RADIUS, getDummyAvatar } from "../lib/theme";

interface Props {
    event: CalendarEvent;
    leftOffset: number;
    widthPercent: number;
    startHourOffset: number;
    durationHours: number;
}

export function EventBlock({ event, leftOffset, widthPercent, startHourOffset, durationHours }: Props) {
    const topPercent = (startHourOffset / 17) * 100;
    const heightPercent = (durationHours / 17) * 100;

    const startTime = format(parseISO(event.start), "h:mm a");
    const endTime = format(parseISO(event.end), "h:mm a");
    const isShort = durationHours <= 0.5;

    const theme = getEventTheme(event);

    return (
        <div
            className={cn(
                "absolute px-2 py-1 text-sm overflow-hidden border-l-4 transition-all hover:shadow-md hover:z-30 cursor-pointer flex flex-col justify-start group",
                RADIUS.event,
                theme.className
            )}
            style={{
                top: `${topPercent}%`,
                height: `calc(${heightPercent}% - 2px)`,
                left: `${leftOffset}%`,
                width: `calc(${widthPercent}% - 4px)`,
                minHeight: "22px",
                ...theme.style
            }}
            title={`${event.title} (${startTime} - ${endTime})\nCalendar: ${event.calendar?.name || "Primary"}`}
        >
            <div className="flex items-center gap-1 font-semibold text-[11px] leading-tight truncate">
                {event.title}
                {event.meetLink && <Video className="w-3 h-3 shrink-0" />}
            </div>

            {!isShort && (
                <div className="flex items-center justify-between mt-0.5">
                    <div className="text-[10px] opacity-90 truncate font-medium leading-[1.1]">
                        {startTime} - {endTime}
                    </div>
                </div>
            )}

            {/* Conditional shared calendar badge */}
            {event.calendar && event.calendar.isShared && (
                <div
                    className="absolute top-1 right-1 h-5 w-5 rounded-full flex items-center justify-center text-[11px] transition-opacity opacity-80 hover:opacity-100 shadow-sm bg-white group/avatar z-10"
                    style={
                        theme.style && theme.style.borderLeftColor
                            ? { border: `1px solid ${theme.style.borderLeftColor}` }
                            : { border: `1px solid #ccc` }
                    }
                >
                    {getDummyAvatar(event.calendar.name)}
                    <div className="absolute opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-opacity bottom-full mb-1.5 right-0 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                        {event.calendar.name}
                    </div>
                </div>
            )}
        </div>
    );
}
