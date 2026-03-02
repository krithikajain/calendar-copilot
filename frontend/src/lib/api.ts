import axios from 'axios';
import { CalendarEvent, UserContext } from '../types';

// Check if we just logged in and got a session ID from the URL
const params = new URLSearchParams(window.location.search);
const sessionId = params.get('session_id');
if (sessionId) {
    localStorage.setItem('session_id', sessionId);
    // Clean up the URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    withCredentials: true,
});

// Automatically inject the session_id token into every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('session_id');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const checkAuth = async (): Promise<UserContext> => {
    try {
        const res = await api.get('/api/me');
        return res.data;
    } catch (error) {
        return { authenticated: false };
    }
};

export const fetchEvents = async (weekStart: string): Promise<CalendarEvent[]> => {
    const res = await api.get(`/api/events?weekStart=${weekStart}`);
    return res.data;
};

export const sendChatMessage = async (message: string): Promise<any> => {
    const res = await api.post('/api/chat', { message });
    return res.data;
};

export const createEvent = async (eventData: any): Promise<any> => {
    const res = await api.post('/api/events/create', eventData);
    return res.data;
};

export const getLoginUrl = () => {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/login`;
};
