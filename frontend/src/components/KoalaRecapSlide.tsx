import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface Props {
    headline: string;
    label: string;
    insight: string;
    colorPrimary: string;
    colorSecondary: string;
    isActive: boolean;
}

export function KoalaRecapSlide({ headline, label, insight, colorPrimary, colorSecondary, isActive }: Props) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isActive) {
            setAnimate(false);
            const timer = setTimeout(() => setAnimate(true), 50);
            return () => clearTimeout(timer);
        } else {
            setAnimate(false);
        }
    }, [isActive]);

    return (
        <div
            className="w-full h-full flex-shrink-0 flex flex-col justify-center items-center text-center p-8 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary})` }}
        >
            {/* Subtle texture overlay */}
            <div className="absolute inset-0 bg-white/5 mix-blend-overlay"></div>

            {/* Animated content */}
            <div className={cn(
                "relative z-10 flex flex-col items-center gap-6 transition-all duration-700 ease-out transform",
                animate ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            )}>
                <h2 className="text-sm font-bold tracking-[0.2em] text-white/70 uppercase">
                    {label}
                </h2>
                <div className="text-7xl font-black text-white tracking-tighter drop-shadow-md">
                    {headline}
                </div>
                <p className="text-lg text-white/90 font-medium max-w-xs leading-relaxed">
                    {insight}
                </p>
            </div>
        </div>
    );
}
