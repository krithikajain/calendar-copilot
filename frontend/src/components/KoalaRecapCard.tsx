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

            <div className="relative z-10 flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                    <h3 className="font-semibold tracking-tight text-white flex items-center gap-2">Koala Recap</h3>
                    <p className="text-xs text-white/50 font-medium">Your week in meetings, in 30 seconds</p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white/10 border border-white/20 shadow-sm shrink-0">
                    <img src="https://img.freepik.com/premium-psd/png-creative-animal-outlines-captivating-artwork-celebrating-natures-diverse-wildlife_1020495-452671.jpg?semt=ais_hybrid&w=740&q=80" alt="Koala AI" className="w-full h-full object-cover scale-110" />
                </div>
            </div>
        </div>
    );
}
