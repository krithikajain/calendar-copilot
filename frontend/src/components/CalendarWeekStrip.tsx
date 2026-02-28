import { format, addDays, isSameDay } from "date-fns";
import { cn } from "../lib/utils";

interface Props {
    weekStart: Date;
    today: Date;
}

export function CalendarWeekStrip({ weekStart, today }: Props) {
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    return (
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white shadow-sm shrink-0 sticky top-0 z-20">
            <div className="text-xl font-semibold text-gray-800 tracking-tight">
                {format(weekStart, "MMMM yyyy")}
            </div>

            <div className="flex items-center gap-1">
                {days.map((day, i) => {
                    const isToday = isSameDay(day, today);

                    return (
                        <div
                            key={i}
                            className={cn(
                                "flex flex-col items-center justify-center w-12 h-14 rounded-lg cursor-pointer transition-colors",
                                isToday ? "bg-blue-50 text-blue-700 border border-blue-200" : "hover:bg-gray-50 text-gray-500"
                            )}
                        >
                            <div className={cn("text-xs font-medium uppercase tracking-wider mb-0.5", isToday && "text-blue-600 font-bold")}>
                                {format(day, "EE")}
                            </div>
                            <div className={cn("text-lg font-semibold", isToday && "text-blue-700 font-bold")}>
                                {format(day, "d")}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
