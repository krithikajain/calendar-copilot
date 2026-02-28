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
