// src/lib/axios.ts
import axios from 'axios';
import type { AxiosInstance } from 'axios';

function normalizeApiBaseUrl(url: string): string {
    const trimmed = url.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const defaultApiBaseUrl = import.meta.env.PROD
    ? 'https://matchedin-backend.free.laravel.cloud'
    : 'http://localhost:8000';

const apiBaseUrl = normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl
);

const api: AxiosInstance = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const preferredLanguage = localStorage.getItem('preferred_language') || 'fr';
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept-Language'] = preferredLanguage;
    config.headers['X-Locale'] = preferredLanguage;
    return config;
});

export default api;