export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    attendeesCount: number;
    location?: string | null;
    organizer?: string | null;
    htmlLink?: string | null;
    category: string;
    tagColor: string;
    calendarName?: string;
    meetLink?: string | null;
    googleColorId?: string | null;
    calendar?: {
        id: string;
        name: string;
        initials: string;
        isShared: boolean;
        accessRole: string;
    };
    google?: {
        eventColorId?: string | null;
        calendarColorId?: string | null;
        resolvedColors?: {
            background: string;
            foreground: string;
        } | null;
    };
}

export interface UserContext {
    authenticated: boolean;
    name?: string;
    email?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}
