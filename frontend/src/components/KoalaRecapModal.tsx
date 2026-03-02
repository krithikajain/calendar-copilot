import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEvent } from '../types';
import { computeRecapStats } from '../lib/recapStats';
import { KoalaRecapSlide } from './KoalaRecapSlide';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    events: CalendarEvent[];
    weekStart: string;
}

export function KoalaRecapModal({ isOpen, onClose, events, weekStart }: Props) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            setStats(computeRecapStats(events, weekStart));
            setCurrentSlide(0);
        }
    }, [isOpen, events, weekStart]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentSlide]);

    if (!isOpen || !stats) return null;

    const slides = [
        {
            label: "Meeting Hours",
            headline: `${stats.totalMeetingHours}h`,
            insight: `You spent ${stats.meetingPercentage} of your work week in meetings.`,
            colorPrimary: "#1e3a8a", // blue-900
            colorSecondary: "#3b82f6" // blue-500
        },
        {
            label: "Busiest Day",
            headline: stats.busiestDay,
            insight: `That was your heaviest meeting day (${stats.busiestDayHours} hrs).`,
            colorPrimary: "#7e22ce", // purple-700
            colorSecondary: "#d946ef" // fuchsia-500
        },
        {
            label: "Deep Work",
            headline: stats.longestDeepWork,
            insight: `You had ${stats.deepWorkCount} deep work blocks (>= 60m). Protect these!`,
            colorPrimary: "#14532d", // green-900
            colorSecondary: "#22c55e" // green-500
        },
        {
            label: "Free Time",
            headline: `${stats.totalFreeHours}h`,
            insight: "This is your available capacity inside work hours this week.",
            colorPrimary: "#7f1d1d", // red-900
            colorSecondary: "#f97316" // orange-500
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) setCurrentSlide(prev => prev + 1);
    };

    const prevSlide = () => {
        if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full h-full max-w-md mx-auto relative bg-black shadow-2xl overflow-hidden flex flex-col">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors backdrop-blur-md focus:outline-none"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Swipeable Container */}
                <div
                    className="flex-1 flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)`, width: `${slides.length * 100}%` }}
                >
                    {slides.map((slide, i) => (
                        <KoalaRecapSlide key={i} {...slide} isActive={i === currentSlide} />
                    ))}
                </div>

                {/* Nav Controls Desktop */}
                <div className="absolute inset-y-0 left-0 hidden md:flex items-center px-4 pointer-events-none z-40">
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className={`p-3 rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40 pointer-events-auto transition-opacity focus:outline-none ${currentSlide === 0 ? 'opacity-0' : 'opacity-100'}`}
                        disabled={currentSlide === 0}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>
                <div className="absolute inset-y-0 right-0 hidden md:flex items-center px-4 pointer-events-none z-40">
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className={`p-3 rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40 pointer-events-auto transition-opacity focus:outline-none ${currentSlide === slides.length - 1 ? 'opacity-0' : 'opacity-100'}`}
                        disabled={currentSlide === slides.length - 1}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Invisible tap zones for mobile */}
                <div
                    className="absolute top-0 bottom-0 left-0 w-1/3 z-30"
                    onClick={prevSlide}
                />
                <div
                    className="absolute top-0 bottom-0 right-0 w-1/3 z-30"
                    onClick={nextSlide}
                />

                {/* Progress Dots */}
                <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-50 pointer-events-none">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
