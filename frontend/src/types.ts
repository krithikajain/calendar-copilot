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

export interface EmailDraft {
    to_name: string;
    to_email: string;
    subject: string;
    body: string;
    slots: any[];
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string; // The main reply
    intent?: string;
    email_drafts?: EmailDraft[];
    needs_user_input?: boolean;
    hint?: string;
    schedule_request?: any;
    slot_options_by_person?: any;
    recommendations?: string[];
    metrics?: any;
    day_brief?: string;
    week_brief?: string;
    draft_event?: any;
    ui_actions?: any;
    validation?: any;
}
