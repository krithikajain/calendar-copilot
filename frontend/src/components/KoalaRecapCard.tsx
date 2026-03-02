import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
    onClick: () => void;
}

export function KoalaRecapCard({ onClick }: Props) {
    return (
        <div
            onClick={onClick}
            className="m-4 rounded-xl p-4 cursor-pointer relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
            style={{
                background: 'linear-gradient(135deg, #18181b 0%, #000000 100%)'
            }}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 ease-out group-hover:scale-125"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -ml-8 -mb-8 transition-transform duration-500 ease-out group-hover:scale-125 delay-75"></div>

            <div className="relative z-10 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-white/90">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <h3 className="font-semibold tracking-tight text-white">Koala Recap</h3>
                </div>
                <p className="text-xs text-white/50 font-medium">Your week in meetings, in 30 seconds</p>
            </div>
        </div>
    );
}
