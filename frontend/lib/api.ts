/**
 * DocuForge API Client
 * Handles all API communication with backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const resolveApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname.toLowerCase();
        const isProduction = host === 'likespdf.vercel.app' || host.endsWith('.vercel.app');

        if (isProduction) {
            // Use same-origin API proxy in production; Next.js rewrites /api/* to Railway.
            return '';
        }
    }

    // Development keeps talking directly to local backend.
    return 'http://127.0.0.1:8000';
};

const API_BASE_URL = resolveApiBaseUrl();

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Try to refresh token
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
                        refresh_token: refreshToken,
                    });

                    localStorage.setItem('access_token', response.data.access_token);
                    localStorage.setItem('refresh_token', response.data.refresh_token);

                    // Retry original request
                    if (error.config) {
                        error.config.headers.Authorization = `Bearer ${response.data.access_token}`;
                        return axios(error.config);
                    }
                } catch {
                    // Refresh failed, clear tokens
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);
