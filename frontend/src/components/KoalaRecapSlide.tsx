import React from 'react';
import { cn } from '../lib/utils';

interface Props {
    headline: string;
    label: string;
    secondary?: string;
    insight: string;
    colorPrimary: string;
    colorSecondary: string;
    isActive: boolean;
    image?: string;
}

export function KoalaRecapSlide({ headline, label, secondary, insight, colorPrimary, colorSecondary, isActive, image }: Props) {


    return (
        <div
            className="w-full h-full flex-shrink-0 flex flex-col justify-center items-center text-center p-8 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary})` }}
        >
            {/* Subtle texture overlay */}
            <div className="absolute inset-0 bg-white/5 mix-blend-overlay"></div>

            {/* Background dummy image based on koala theme */}
            {image && (
                <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-luminosity">
                    <img src={image} className="w-full h-full object-cover" alt="" />
                </div>
            )}

            {/* Static content - no motion/timebased animation */}
            <div className={cn(
                "relative z-10 flex flex-col items-center gap-6",
            )}>
                <h2 className="text-sm font-bold tracking-[0.2em] text-white/50 uppercase">
                    {label}
                </h2>
                <div className="flex flex-col items-center gap-2">
                    <div className="text-7xl font-black text-white tracking-tighter drop-shadow-md text-center leading-none">
                        {headline}
                    </div>
                    {secondary && (
                        <div className="text-2xl font-bold text-white/90 tracking-tight text-center">
                            {secondary}
                        </div>
                    )}
                </div>
                <p className="text-lg text-white/80 font-medium max-w-xs leading-relaxed text-center mt-2">
                    {insight}
                </p>
            </div>
        </div>
    );
}
