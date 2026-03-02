import { useState, useEffect } from "react";
import { fetchEvents, checkAuth, getLoginUrl } from "./lib/api";
import { UserContext, CalendarEvent } from "./types";
import { ChatPanel } from "./components/ChatPanel";
import { CalendarWeekStrip } from "./components/CalendarWeekStrip";
import { CalendarTimeline } from "./components/CalendarTimeline";
import { CreateEventModal } from "./components/CreateEventModal";
import { format, startOfWeek } from "date-fns";
import { Calendar, RefreshCw, LogIn, Plus } from "lucide-react";

function App() {
    const [user, setUser] = useState<UserContext | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalData, setCreateModalData] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');

    const loadData = async () => {
        setLoading(true);
        const authStatus = await checkAuth();
        setUser(authStatus);

        // We always fetch events, mock ones will be returned if not perfectly authed
        try {
            const evs = await fetchEvents(weekStartStr);
            setEvents(evs);
        } catch (err) {
            console.error("Error fetching events:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateEvent = async (eventData: any) => {
        setIsCreating(true);
        try {
            const { createEvent } = await import('./lib/api');
            await createEvent(eventData);
            setIsCreateModalOpen(false);
            loadData();
        } catch (error: any) {
            if (error.response?.status === 403) {
                alert("Please reconnect your Google Calendar to grant write permissions.");
            } else {
                console.error("Failed to create event:", error);
                alert("Failed to create event. See console for details.");
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#fafafa] font-sans text-gray-800">
            {/* Header */}
            <header className="h-14 border-b border-gray-800 bg-black flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-white/10 border border-white/10 shadow-sm">
                        <img src="https://img.freepik.com/premium-psd/png-creative-animal-outlines-captivating-artwork-celebrating-natures-diverse-wildlife_1020495-452671.jpg?semt=ais_hybrid&w=740&q=80" alt="Koala" className="w-full h-full object-cover scale-110" />
                    </div>
                    <h1 className="font-semibold text-white text-[20px] tracking-tight">Ko-Calendar</h1>
                </div>

                <div className="flex items-center gap-4 text-sm">
                    {user === null || loading ? (
                        <div className="text-gray-400">Loading...</div>
                    ) : user.authenticated ? (
                        <div className="flex items-center gap-3">
                            <span className="text-gray-300 line-clamp-1 max-w-[150px]">{user.email}</span>
                            <div className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                                Connected
                            </div>
                            <div className="h-4 w-px bg-gray-700 mx-1"></div>
                            <button onClick={loadData} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 transition-colors" title="Refresh Events">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="px-2.5 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-medium border border-yellow-500/30">
                                Mock Mode
                            </div>
                            <a
                                href={getLoginUrl()}
                                className="flex items-center gap-1.5 bg-white/10 border border-white/20 shadow-sm hover:bg-white/20 text-white px-3 py-1.5 rounded-md font-medium transition-all"
                            >
                                <LogIn className="w-4 h-4" />
                                Connect Google Calendar
                            </a>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex flex-1 overflow-hidden">

                {/* Left Column: Calendar */}
                <section className="flex-1 flex flex-col bg-white relative min-w-0">
                    <CalendarWeekStrip weekStart={weekStart} today={today} onCreateEvent={() => {
                        setCreateModalData(null);
                        setIsCreateModalOpen(true);
                    }} />
                    <div className="flex-1 overflow-y-auto relative bg-[#fdfdfd]">
                        <CalendarTimeline events={events} weekStart={weekStart} />
                    </div>

                    {/* AI Triggered or Manual Modal - Rendered here to be "on the calendar UI" */}
                    <CreateEventModal
                        isOpen={isCreateModalOpen}
                        onClose={() => {
                            setIsCreateModalOpen(false);
                            setCreateModalData(null);
                        }}
                        onConfirm={handleCreateEvent}
                        initialData={createModalData}
                        isLoading={isCreating}
                    />
                </section>

                {/* Right Column: Chat Agent */}
                <section className="w-[300px] shrink-0 flex flex-col bg-white border-l border-gray-200">
                    <ChatPanel
                        user={user}
                        onEventCreated={loadData}
                        onDraftEventReady={(data) => {
                            setCreateModalData(data);
                            setIsCreateModalOpen(true);
                        }}
                    />
                </section>

            </main>

            {/* Remove global modal from here */}
        </div>
    );
}

export default App;
