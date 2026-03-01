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

const AVATARS = ['🦊', '🐰', '🐼', '🐻', '🐯', '🦁', '🐮', '🐷', '🐸', '🐙', '🐶', '🐱'];

export function getDummyAvatar(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATARS.length;
    return AVATARS[index];
}

export function hexToPastelTheme(hex: string) {
    // If it's a valid hex
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return {
            backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
            color: `#111827`, // Use dark black text for readability
            borderLeftColor: `rgba(${r}, ${g}, ${b}, 1)`,
        };
    }
    return null;
}

export const getEventTheme = (event: CalendarEvent): { className: string; style?: React.CSSProperties } => {
    // 1. Exact replica of Google colors via backend's resolved colors payload, scaled down to pastel
    if (event.google?.resolvedColors?.background) {
        const pastelStyle = hexToPastelTheme(event.google.resolvedColors.background);
        if (pastelStyle) {
            return {
                className: '',
                style: pastelStyle
            };
        }
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
