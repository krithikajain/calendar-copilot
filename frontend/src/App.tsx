import { useState, useEffect } from "react";
import { fetchEvents, checkAuth, getLoginUrl } from "./lib/api";
import { UserContext, CalendarEvent } from "./types";
import { ChatPanel } from "./components/ChatPanel";
import { CalendarWeekStrip } from "./components/CalendarWeekStrip";
import { CalendarTimeline } from "./components/CalendarTimeline";
import { format, startOfWeek } from "date-fns";
import { Calendar, RefreshCw, LogIn } from "lucide-react";

function App() {
    const [user, setUser] = useState<UserContext | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="flex flex-col h-screen bg-[#fafafa] font-sans text-gray-800">
            {/* Header */}
            <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-2.5">
                    <div className="bg-black p-1.5 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="font-semibold text-gray-800 text-[20px] tracking-tight">Copilot</h1>
                </div>

                <div className="flex items-center gap-4 text-sm">
                    {user === null || loading ? (
                        <div className="text-gray-400">Loading...</div>
                    ) : user.authenticated ? (
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 line-clamp-1 max-w-[150px]">{user.email}</span>
                            <div className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-200">
                                Connected
                            </div>
                            <button onClick={loadData} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors" title="Refresh Events">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-200">
                                Mock Mode
                            </div>
                            <a
                                href={getLoginUrl()}
                                className="flex items-center gap-1.5 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md font-medium transition-all"
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
                    <CalendarWeekStrip weekStart={weekStart} today={today} />
                    <div className="flex-1 overflow-y-auto relative bg-[#fdfdfd]">
                        <CalendarTimeline events={events} weekStart={weekStart} />
                    </div>
                </section>

                {/* Right Column: Chat Agent */}
                <section className="w-[300px] shrink-0 flex flex-col bg-white border-l border-gray-200">
                    <ChatPanel />
                </section>

            </main>
        </div>
    );
}

export default App;
