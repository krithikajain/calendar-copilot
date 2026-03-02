import { LogIn, ArrowRight, Sparkles } from "lucide-react";
import { getLoginUrl } from "../lib/api";

interface LandingPageProps {
    onDemoClick: () => void;
}

export function LandingPage({ onDemoClick }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/5 blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>

            <div className="z-10 w-full max-w-md p-8 md:p-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">

                <div className="w-24 h-24 mb-6 rounded-2xl flex items-center justify-center overflow-hidden bg-white/10 border border-white/20 shadow-xl relative group">
                    <img src="https://img.freepik.com/premium-psd/png-creative-animal-outlines-captivating-artwork-celebrating-natures-diverse-wildlife_1020495-452671.jpg?semt=ais_hybrid&w=740&q=80" alt="Koala" className="w-full h-full object-cover scale-110 transition-transform duration-700 group-hover:scale-125" />
                </div>

                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Ko-Calendar</h1>
                <p className="text-gray-400 mb-10 text-base font-medium leading-relaxed">Your smart, lazy calendar assistant. Let Koala handle the scheduling while you relax.</p>

                <div className="w-full space-y-3">
                    <a
                        href={getLoginUrl()}
                        className="w-full py-3.5 px-6 flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all shadow-md group"
                    >
                        <LogIn className="w-5 h-5" />
                        Connect Google Calendar
                        <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    </a>

                    <button
                        onClick={onDemoClick}
                        className="w-full py-3.5 px-6 flex items-center justify-center gap-2 bg-transparent text-gray-400 font-medium rounded-xl hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        Try Demo (Mock Mode)
                    </button>
                </div>

                <div className="mt-10 text-xs text-gray-500 font-medium">
                    Secure login via Google OAuth.<br />
                    We only ask for calendar permissions.
                </div>
            </div>
        </div>
    );
}
