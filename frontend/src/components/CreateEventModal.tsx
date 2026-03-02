import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { X, Calendar, Clock, MapPin, Users, AlignLeft } from "lucide-react";

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (eventData: any) => void;
    initialData?: any;
    isLoading?: boolean;
}

export function CreateEventModal({ isOpen, onClose, onConfirm, initialData, isLoading }: CreateEventModalProps) {
    const [title, setTitle] = useState("New Event");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [attendees, setAttendees] = useState("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (initialData?.start) {
                const startObj = new Date(initialData.start);
                const endObj = initialData.end ? new Date(initialData.end) : new Date(startObj.getTime() + 30 * 60000);

                // Format YYYY-MM-DD for local date input
                setDate(startObj.toLocaleDateString('en-CA'));
                // Format HH:MM for time inputs
                setStartTime(startObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                setEndTime(endObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            } else {
                const now = new Date();
                // Round to next 30 mins
                now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);

                setDate(now.toLocaleDateString('en-CA'));
                setStartTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

                now.setMinutes(now.getMinutes() + 30);
                setEndTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            }

            setTitle(initialData?.title || "");
            setAttendees(initialData?.attendees?.join(", ") || "");
            setLocation(initialData?.location || "");
            setNotes(initialData?.notes || "");
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Construct ISO strings
        const startIso = new Date(`${date}T${startTime}`).toISOString();
        const endIso = new Date(`${date}T${endTime}`).toISOString();

        const attendeeList = attendees.split(",")
            .map(a => a.trim())
            .filter(a => a.length > 0);

        onConfirm({
            title: title || "New Event",
            start: startIso,
            end: endIso,
            attendees: attendeeList,
            location,
            notes
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {initialData ? "Review Draft Event" : "Create Event"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Add title"
                            className="w-full text-xl font-medium text-gray-900 placeholder:text-gray-400 border-0 border-b border-transparent hover:border-gray-200 focus:border-gray-300 focus:ring-0 px-0 pb-2 transition-colors bg-transparent"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <div className="flex gap-2 flex-1">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black/5 focus:border-gray-400 block p-2.5"
                                    required
                                />
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-24 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black/5 focus:border-gray-400 block p-2.5"
                                    required
                                />
                                <span className="text-gray-500 self-center">-</span>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-24 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black/5 focus:border-gray-400 block p-2.5"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={attendees}
                                onChange={(e) => setAttendees(e.target.value)}
                                placeholder="Add guests (comma separated emails)"
                                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black/5 focus:border-gray-400 block p-2.5"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Add location"
                                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black/5 focus:border-gray-400 block p-2.5"
                            />
                        </div>

                        <div className="flex items-start gap-3">
                            <AlignLeft className="w-5 h-5 text-gray-400 mt-2.5" />
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add description"
                                rows={3}
                                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black/5 focus:border-gray-400 block p-2.5 resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center min-w-[80px]"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Save"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
