import { format, addDays, isSameDay } from "date-fns";
import { cn } from "../lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
    weekStart: Date;
    today: Date;
}

export function CalendarWeekStrip({ weekStart, today }: Props) {
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    return (
        <div className="flex flex-col bg-white shrink-0 sticky top-0 z-20">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                <div className="flex items-center gap-6">
                    <div className="text-xl font-normal text-gray-800">
                        {format(weekStart, "MMMM yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button className="ml-2 px-4 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 transition">
                            Today
                        </button>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden text-sm font-medium">
                    <button onClick={() => alert("Day view coming soon in v2!")} className="px-4 py-1.5 text-gray-600 bg-white hover:bg-gray-50 border-r border-gray-300 transition">Day</button>
                    <button className="px-4 py-1.5 bg-gray-100 text-black border-r border-gray-300 transition">Week</button>
                    <button onClick={() => alert("Month view coming soon in v2!")} className="px-4 py-1.5 text-gray-600 bg-white hover:bg-gray-50 transition">Month</button>
                </div>
            </div>

            {/* Days Strip aligned with left axis of timeline */}
            <div className="flex items-center pl-16 pr-2 pt-3 pb-2 border-b border-gray-100">
                {days.map((day, i) => {
                    const isToday = isSameDay(day, today);

                    return (
                        <div
                            key={i}
                            className="flex-1 flex flex-col items-center justify-center cursor-pointer group"
                        >
                            <div className={cn("text-[11px] font-medium uppercase tracking-wider mb-0.5", isToday ? "text-gray-900 font-bold" : "text-gray-500")}>
                                {format(day, "EEE")}
                            </div>
                            <div className={cn(
                                "w-11 h-11 flex items-center justify-center text-[24px] font-normal transition-colors",
                                isToday
                                    ? "bg-black text-white rounded-full"
                                    : "text-gray-700 group-hover:bg-gray-100 rounded-full"
                            )}>
                                {format(day, "d")}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
