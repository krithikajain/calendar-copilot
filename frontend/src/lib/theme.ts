import { CalendarEvent, UserContext } from "../types";
import React from 'react';

export const CATEGORY_COLORS: Record<string, string> = {
    Meeting: 'bg-gray-100 text-gray-800 border-l-gray-800',
    Fitness: 'bg-gray-100 text-gray-800 border-l-gray-800',
    Break: 'bg-gray-100 text-gray-800 border-l-gray-800',
    Travel: 'bg-gray-100 text-gray-800 border-l-gray-800',
    Focus: 'bg-gray-100 text-gray-800 border-l-gray-800',
    Shared: 'bg-gray-100 text-gray-800 border-l-gray-800',
    Uncategorized: 'bg-gray-50 text-gray-500 border-l-gray-400',
};

export const getEventTheme = (event: CalendarEvent): { className: string; style?: React.CSSProperties } => {
    // 1. Exact replica of Google colors via backend's resolved colors payload
    if (event.google?.resolvedColors) {
        return {
            className: '',
            style: {
                backgroundColor: event.google.resolvedColors.background,
                color: event.google.resolvedColors.foreground,
                borderLeftColor: event.google.resolvedColors.foreground,
            }
        };
    }

    // 2. Fallback styling
    return {
        className: CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Uncategorized
    };
};

export const RADIUS = {
    event: 'rounded-md',
    dayPill: 'rounded-full',
};
