import { CalendarEvent } from "../types";
import { EventBlock } from "./EventBlock";
import { addDays, parseISO, isSameDay, format } from "date-fns";
import { useState } from "react";
import { X, Clock, AlignLeft, Users, Calendar as CalendarIcon, MapPin, Video } from "lucide-react";
import { getEventTheme } from "../lib/theme";

interface Props {
    events: CalendarEvent[];
    weekStart: Date;
}

export function CalendarTimeline({ events, weekStart }: Props) {
    const START_HOUR = 6;
    const END_HOUR = 23;
    const TOTAL_HOURS = END_HOUR - START_HOUR;

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
                                <div key={ev.id} onClick={() => setSelectedEvent(ev)}>
                                    <EventBlock
                                        event={ev}
                                        leftOffset={styleInfo.leftOffset}
                                        widthPercent={styleInfo.widthPercent}
                                        startHourOffset={styleInfo.startHourOffset}
                                        durationHours={styleInfo.durationHours}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={() => setSelectedEvent(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header color bar */}
                        <div
                            className="h-3 w-full"
                            style={{ backgroundColor: getEventTheme(selectedEvent).style?.borderLeftColor || '#cbd5e1' }}
                        />

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 leading-tight mb-1">
                                        {selectedEvent.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                                        <CalendarIcon className="w-4 h-4" />
                                        {format(parseISO(selectedEvent.start), "EEEE, MMMM d, yyyy")}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3 text-gray-600">
                                    <Clock className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" />
                                    <div>
                                        <div className="text-sm font-medium">
                                            {format(parseISO(selectedEvent.start), "h:mm a")} – {format(parseISO(selectedEvent.end), "h:mm a")}
                                        </div>
                                    </div>
                                </div>

                                {selectedEvent.meetLink && (
                                    <div className="flex items-start gap-3 text-gray-600">
                                        <Video className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" />
                                        <a href={selectedEvent.meetLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline font-medium">
                                            Join Video Call
                                        </a>
                                    </div>
                                )}

                                {selectedEvent.calendar && (
                                    <div className="flex items-start gap-3 text-gray-600">
                                        <Users className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" />
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-800">Calendar:</span> {selectedEvent.calendar.name}
                                            {selectedEvent.calendar.isShared && <span className="ml-2 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-gray-500">Shared</span>}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3 text-gray-600">
                                    <AlignLeft className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" />
                                    <div className="text-sm">
                                        <span className="font-medium text-gray-800">Category:</span> {selectedEvent.category}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
