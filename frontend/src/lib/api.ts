import axios from 'axios';
import { CalendarEvent, UserContext } from '../types';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    withCredentials: true,
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
