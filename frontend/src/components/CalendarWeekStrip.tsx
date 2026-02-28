import { format, addDays, isSameDay } from "date-fns";
import { cn } from "../lib/utils";
import { RADIUS } from "../lib/theme";

interface Props {
    weekStart: Date;
    today: Date;
}

export function CalendarWeekStrip({ weekStart, today }: Props) {
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shadow-sm shrink-0 sticky top-0 z-20">
            <div className="text-2xl font-bold text-gray-800 tracking-tight">
                {format(weekStart, "MMMM, yyyy")}
            </div>

            <div className="flex items-center gap-3">
                {days.map((day, i) => {
                    const isToday = isSameDay(day, today);

                    return (
                        <div
                            key={i}
                            className={cn(
                                "flex flex-col items-center justify-center w-[72px] h-[84px] cursor-pointer transition-all border",
                                RADIUS.dayPill,
                                isToday
                                    ? "bg-[#2a2d34] text-white border-transparent shadow-md hover:bg-gray-800"
                                    : "bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                            )}
                        >
                            <div className={cn("text-xs font-semibold mb-1", isToday ? "text-gray-300" : "text-gray-400")}>
                                {format(day, "EEEE")}
                            </div>
                            <div className={cn("text-2xl font-bold", isToday ? "text-white" : "text-gray-800")}>
                                {format(day, "d")}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
