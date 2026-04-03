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

// ============================================================================
// API Endpoints
// ============================================================================

export const documentsApi = {
    async upload(file: File, onProgress?: (progress: number) => void) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    onProgress(progress);
                }
            },
        });

        return response.data;
    },

    async downloadBlobUrl(url: string) {
        const response = await api.get(url, {
            responseType: 'blob',
        });

        // Extract filename from Content-Disposition header or URL
        let filename = 'download';
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        return {
            blob: response.data,
            filename,
        };
    },

    async list(page = 1, pageSize = 20) {
        const response = await api.get('/api/v1/documents', {
            params: {
                page,
                page_size: pageSize,
            },
        });
        return response.data;
    },

    async downloadBlob(documentId: string) {
        const response = await api.get(`/api/v1/documents/${documentId}/download`, {
            responseType: 'blob',
        });

        let filename = `document-${documentId}.pdf`;
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        return {
            blob: response.data,
            filename,
        };
    },
};

export const conversionsApi = {
    async merge(fileIds: string[]) {
        const response = await api.post('/api/v1/conversions/merge', {
            file_ids: fileIds,
        });
        return response.data;
    },

    async pdfToText(fileId: string) {
        const response = await api.post('/api/v1/conversions/pdf-to-text', {
            file_id: fileId,
        });
        return response.data;
    },

    async pdfToWord(fileId: string) {
        const response = await api.post('/api/v1/conversions/pdf-to-word', {
            file_id: fileId,
        });
        return response.data;
    },

    async pdfToExcel(fileId: string) {
        const response = await api.post('/api/v1/conversions/pdf-to-excel', {
            file_id: fileId,
        });
        return response.data;
    },

    async pdfToCsv(fileId: string) {
        const response = await api.post('/api/v1/conversions/pdf-to-csv', {
            file_id: fileId,
        });
        return response.data;
    },

    async pdfToJson(fileId: string) {
        const response = await api.post('/api/v1/conversions/pdf-to-json', {
            file_id: fileId,
        });
        return response.data;
    },

    async pdfToXml(fileId: string) {
        const response = await api.post('/api/v1/conversions/pdf-to-xml', {
            file_id: fileId,
        });
        return response.data;
    },

    async wordToPdf(fileId: string) {
        const response = await api.post('/api/v1/conversions/word-to-pdf', {
            file_id: fileId,
        });
        return response.data;
    },

    async excelToPdf(fileId: string) {
        const response = await api.post('/api/v1/conversions/excel-to-pdf', {
            file_id: fileId,
        });
        return response.data;
    },

    async csvToPdf(fileId: string) {
        const response = await api.post('/api/v1/conversions/csv-to-pdf', {
            file_id: fileId,
        });
        return response.data;
    },

    async htmlToPdf(htmlContent?: string, url?: string) {
        const response = await api.post('/api/v1/conversions/html-to-pdf', {
            html_content: htmlContent,
            url,
        });
        return response.data;
    },

    async jsonToPdf(fileId: string) {
        const response = await api.post('/api/v1/conversions/json-to-pdf', {
            file_id: fileId,
        });
        return response.data;
    },

    async pptToPdf(fileId: string) {
        const response = await api.post('/api/v1/conversions/ppt-to-pdf', {
            file_id: fileId,
        });
        return response.data;
    },

    async imagesToPdf(fileIds: string[]) {
        const response = await api.post('/api/v1/conversions/images-to-pdf', {
            file_ids: fileIds,
        });
        return response.data;
    },

    async pdfToImages(fileId: string, options?: { format?: string; dpi?: number }) {
        const response = await api.post('/api/v1/conversions/pdf-to-images', {
            file_id: fileId,
            ...options,
        });
        return response.data;
    },
};

export const editingApi = {
    async merge(fileIds: string[]) {
        const response = await api.post('/api/v1/editing/merge', {
            file_ids: fileIds,
        });
        return response.data;
    },

    async deletePages(fileId: string, pageNumbers: number[]) {
        const response = await api.post('/api/v1/editing/delete-pages', {
            file_id: fileId,
            page_numbers: pageNumbers,
        });
        return response.data;
    },

    async split(
        fileId: string,
        mode: 'pages' | 'range',
        pages?: number[],
        ranges?: string[]
    ) {
        const response = await api.post('/api/v1/editing/split', {
            file_id: fileId,
            mode,
            pages,
            ranges,
        });
        return response.data;
    },

    async rotate(fileId: string, rotations: Record<number, number>) {
        const response = await api.post('/api/v1/editing/rotate', {
            file_id: fileId,
            page_rotations: rotations,
        });
        return response.data;
    },

    async reorder(fileId: string, pageOrder: number[]) {
        const response = await api.post('/api/v1/editing/reorder', {
            file_id: fileId,
            page_order: pageOrder,
        });
        return response.data;
    },

    async extractPages(fileId: string, pageNumbers: number[]) {
        const response = await api.post('/api/v1/editing/extract-pages', {
            file_id: fileId,
            page_numbers: pageNumbers,
        });
        return response.data;
    },
};

export const optimizationApi = {
    async compress(fileId: string, quality?: string) {
        const response = await api.post('/api/v1/optimization/compress', {
            file_id: fileId,
            quality: quality || 'medium',
        });
        return response.data;
    },
};

export const securityApi = {
    async addPassword(fileId: string, password: string) {
        const response = await api.post('/api/v1/security/add-password', {
            file_id: fileId,
            password,
        });
        return response.data;
    },

    async removePassword(fileId: string, password: string) {
        const response = await api.post('/api/v1/security/remove-password', {
            file_id: fileId,
            password,
        });
        return response.data;
    },

    async getThumbnails(fileId: string, pages: 'all' | number[] = 'all', width = 150) {
        const response = await api.post('/api/v1/security/thumbnails', {
            file_id: fileId,
            pages,
            width,
        });
        return response.data;
    },
};

export const authApi = {
    async login(username: string, password: string) {
        const response = await api.post('/api/v1/auth/login', {
            username,
            password,
        });
        return response.data;
    },

    async register(email: string, password: string, username?: string) {
        const response = await api.post('/api/v1/auth/register', {
            email,
            password,
            username: username || email,
        });
        return response.data;
    },

    async logout() {
        const response = await api.post('/api/v1/auth/logout');
        return response.data;
    },

    async getProfile() {
        const response = await api.get('/api/v1/auth/me');
        return response.data;
    },
};

export default api;
