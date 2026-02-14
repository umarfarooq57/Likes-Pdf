/**
 * DocuForge API Client
 * Handles all API communication with backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
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
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
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

// ============== Auth API ==============

export const authApi = {
    register: async (email: string, password: string, fullName?: string) => {
        const response = await api.post('/auth/register', { email, password, full_name: fullName });
        return response.data;
    },

    login: async (email: string, password: string) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);

        return response.data;
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },

    getProfile: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

// ============== Documents API ==============

export const documentsApi = {
    upload: async (file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        });

        return response.data;
    },

    uploadMultiple: async (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const response = await api.post('/documents/upload/batch', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return response.data;
    },

    list: async (page = 1, pageSize = 20) => {
        const response = await api.get(`/documents?page=${page}&page_size=${pageSize}`);
        return response.data;
    },

    get: async (id: string) => {
        const response = await api.get(`/documents/${id}`);
        return response.data;
    },

    download: (id: string) => {
        return `${API_BASE_URL}/documents/${id}/download`;
    },

    delete: async (id: string) => {
        await api.delete(`/documents/${id}`);
    },
};

// ============== Conversions API ==============

export const conversionsApi = {
    pdfToImages: async (documentId: string, options: { format?: string; dpi?: number } = {}) => {
        const response = await api.post('/convert/pdf-to-images', {
            document_id: documentId,
            options,
        });
        return response.data;
    },

    imagesToPdf: async (documentIds: string[]) => {
        const response = await api.post('/convert/images-to-pdf', documentIds);
        return response.data;
    },

    htmlToPdf: async (htmlContent?: string, url?: string, options = {}) => {
        const response = await api.post('/convert/html-to-pdf', {
            html_content: htmlContent,
            url,
            options,
        });
        return response.data;
    },

    markdownToPdf: async (markdownContent: string, options = {}) => {
        const response = await api.post('/convert/markdown-to-pdf', {
            markdown_content: markdownContent,
            options,
        });
        return response.data;
    },

    pdfToWord: async (documentId: string) => {
        const response = await api.post('/convert/pdf-to-word', { document_id: documentId });
        return response.data;
    },

    wordToPdf: async (documentId: string) => {
        const response = await api.post('/convert/word-to-pdf', { document_id: documentId });
        return response.data;
    },

    excelToPdf: async (documentId: string) => {
        const response = await api.post('/convert/excel-to-pdf', { document_id: documentId });
        return response.data;
    },

    pptToPdf: async (documentId: string) => {
        const response = await api.post('/convert/ppt-to-pdf', { document_id: documentId });
        return response.data;
    },

    pdfToCsv: async (documentId: string) => {
        const response = await api.post('/convert/pdf-to-csv', { document_id: documentId });
        return response.data;
    },

    pdfToXml: async (documentId: string) => {
        const response = await api.post('/convert/pdf-to-xml', { document_id: documentId });
        return response.data;
    },

    pdfToJson: async (documentId: string) => {
        const response = await api.post('/convert/pdf-to-json', { document_id: documentId });
        return response.data;
    },

    csvToPdf: async (documentId: string) => {
        const response = await api.post('/convert/csv-to-pdf', { document_id: documentId });
        return response.data;
    },

    jsonToPdf: async (documentId: string) => {
        const response = await api.post('/convert/json-to-pdf', { document_id: documentId });
        return response.data;
    },

    getStatus: async (conversionId: string) => {
        const response = await api.get(`/convert/${conversionId}/status`);
        return response.data;
    },

    downloadResult: (conversionId: string) => {
        return `${API_BASE_URL}/convert/${conversionId}/download`;
    },
};

// ============== Editing API ==============

export const editingApi = {
    merge: async (documentIds: string[], outputFilename?: string) => {
        const response = await api.post('/edit/merge', {
            document_ids: documentIds,
            output_filename: outputFilename,
        });
        return response.data;
    },

    split: async (documentId: string, mode: 'pages' | 'range', pages?: number[], ranges?: string[]) => {
        const response = await api.post('/edit/split', {
            document_id: documentId,
            mode,
            pages,
            ranges,
        });
        return response.data;
    },

    rotate: async (documentId: string, rotations: Record<number, number>) => {
        const response = await api.post('/edit/rotate', {
            document_id: documentId,
            rotations,
        });
        return response.data;
    },

    reorder: async (documentId: string, newOrder: number[]) => {
        const response = await api.post('/edit/reorder', {
            document_id: documentId,
            new_order: newOrder,
        });
        return response.data;
    },

    deletePages: async (documentId: string, pages: number[]) => {
        const response = await api.post('/edit/delete-pages', {
            document_id: documentId,
            pages,
        });
        return response.data;
    },

    extractPages: async (documentId: string, pages: number[]) => {
        const response = await api.post('/edit/extract-pages', {
            document_id: documentId,
            pages,
        });
        return response.data;
    },
};

// ============== Optimization API ==============

export const optimizationApi = {
    compress: async (documentId: string, quality: 'low' | 'medium' | 'high' = 'medium') => {
        const response = await api.post('/optimize/compress', {
            document_id: documentId,
            quality,
        });
        return response.data;
    },

    linearize: async (documentId: string) => {
        const response = await api.post(`/optimize/linearize?document_id=${documentId}`);
        return response.data;
    },

    repair: async (documentId: string) => {
        const response = await api.post(`/optimize/repair?document_id=${documentId}`);
        return response.data;
    },
};

// ============== Security API ==============

export const securityApi = {
    protect: async (documentId: string, userPassword?: string, ownerPassword?: string, permissions?: string[]) => {
        const response = await api.post('/security/protect', {
            document_id: documentId,
            user_password: userPassword,
            owner_password: ownerPassword,
            permissions,
        });
        return response.data;
    },

    unlock: async (documentId: string, password: string) => {
        const response = await api.post('/security/unlock', {
            document_id: documentId,
            password,
        });
        return response.data;
    },

    addTextWatermark: async (documentId: string, text: string, options: {
        position?: string;
        fontSize?: number;
        opacity?: number;
        rotation?: number;
        color?: string;
        pages?: string;
    } = {}) => {
        const response = await api.post('/security/watermark/text', {
            document_id: documentId,
            text,
            position: options.position || 'center',
            font_size: options.fontSize || 48,
            opacity: options.opacity || 0.3,
            rotation: options.rotation || 45,
            color: options.color || '#000000',
            pages: options.pages || 'all',
        });
        return response.data;
    },

    addImageWatermark: async (documentId: string, imageDocumentId: string, options: {
        position?: string;
        scale?: number;
        opacity?: number;
        pages?: string;
    } = {}) => {
        const response = await api.post('/security/watermark/image', {
            document_id: documentId,
            image_document_id: imageDocumentId,
            position: options.position || 'center',
            scale: options.scale || 0.5,
            opacity: options.opacity || 0.3,
            pages: options.pages || 'all',
        });
        return response.data;
    },

    addPageNumbers: async (documentId: string, options: {
        position?: string;
        format?: string;
        fontSize?: number;
        startNumber?: number;
    } = {}) => {
        const response = await api.post('/security/page-numbers', {
            document_id: documentId,
            position: options.position || 'bottom-center',
            format: options.format || 'Page {n} of {total}',
            font_size: options.fontSize || 10,
            start_number: options.startNumber || 1,
        });
        return response.data;
    },

    checkProtection: async (documentId: string) => {
        const response = await api.get(`/security/check/${documentId}`);
        return response.data;
    },

    getMetadata: async (documentId: string) => {
        const response = await api.get(`/security/metadata/${documentId}`);
        return response.data;
    },

    setMetadata: async (documentId: string, metadata: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string;
        creator?: string;
    }) => {
        const response = await api.post('/security/metadata', {
            document_id: documentId,
            ...metadata,
        });
        return response.data;
    },

    getThumbnails: async (documentId: string, pages?: string, size?: number) => {
        const params = new URLSearchParams();
        if (pages) params.append('pages', pages);
        if (size) params.append('size', size.toString());

        const response = await api.get(`/security/thumbnails/${documentId}?${params}`);
        return response.data;
    },
};

export default api;
