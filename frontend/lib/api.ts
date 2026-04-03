/**
 * DocuForge API Client
 * Handles all API communication with backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const resolveApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    if (typeof window !== 'undefined') {
        const host = window.location.hostname.toLowerCase();
        if (host === 'likespdf.vercel.app' || host.endsWith('.vercel.app')) {
            return 'https://likes-pdf-backend-production-668e.up.railway.app';
        }
    }

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

// ============== Auth API ==============

export const authApi = {
    register: async (email: string, password: string, fullName?: string) => {
        const response = await api.post('/api/v1/auth/register', { email, password, full_name: fullName });
        return response.data;
    },

    login: async (email: string, password: string) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);

        const response = await api.post('/api/v1/auth/login', params.toString(), {
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
        const response = await api.get('/api/v1/auth/me');
        return response.data;
    },
};

// ============== Documents API ==============

export const documentsApi = {
    upload: async (file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);

        const requestConfig = {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent: any) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        };

        let response;
        try {
            // Prefer v1 API when available
            response = await api.post('/api/v1/documents/upload', formData, requestConfig);
        } catch (error: any) {
            const statusCode = error?.response?.status;
            if (statusCode === 404) {
                // Fallback for legacy production API shape
                response = await api.post('/api/upload', formData, requestConfig);
            } else {
                throw error;
            }
        }

        const data = response.data || {};

        // Normalize backend response fields to a consistent shape used by the UI
        return {
            id: (data.id || data.file_id || data.fileId || data.file_id) ? String(data.id || data.file_id || data.fileId) : undefined,
            filename: data.filename || data.original_name || data.originalName || file.name,
            size: data.size || data.file_size || data.fileSize || file.size,
            mime_type: data.mime_type || data.mimeType || file.type,
            // include original response for any other fields
            _raw: data,
        };
    },

    uploadMultiple: async (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        try {
            // Backend batch upload path
            const response = await api.post('/api/v1/documents/upload/batch', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            // Legacy backend has only single-file upload endpoint.
            if (error?.response?.status !== 404) {
                throw error;
            }

            const uploads = await Promise.all(
                files.map((file) => documentsApi.upload(file))
            );
            return uploads;
        }
    },

    list: async (page = 1, pageSize = 20) => {
        const response = await api.get(`/api/v1/documents?page=${page}&page_size=${pageSize}`);
        return response.data;
    },

    get: async (id: string) => {
        const response = await api.get(`/api/v1/documents/${id}`);
        return response.data;
    },

    download: (id: string) => {
        // Backend exposes a download endpoint at /api/v1/documents/{id}/download
        return `${API_BASE_URL}/api/v1/documents/${id}/download`;
    },

    // Download file as binary (handles errors and filenames)
    downloadBlob: async (id: string) => {
        const url = `${API_BASE_URL}/api/v1/documents/${id}/download`;
        try {
            const token = localStorage.getItem('access_token');
            const headers: Record<string, string> = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await axios.get(url, {
                responseType: 'blob',
                headers,
            });

            const contentType = response.headers['content-type'] || '';

            // If backend returned an error as JSON/text, parse and surface it
            if (contentType.includes('application/json') || contentType.startsWith('text/')) {
                // convert blob to text
                const text = await new Response(response.data).text();
                let msg = text;
                try {
                    const parsed = JSON.parse(text);
                    msg = parsed.detail || parsed.message || JSON.stringify(parsed);
                } catch { }
                throw new Error(msg || 'Download failed');
            }

            // Determine filename from Content-Disposition
            let filename = 'downloaded-file';
            const cd = response.headers['content-disposition'];
            if (cd) {
                const match = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i);
                if (match && match[1]) filename = decodeURIComponent(match[1]);
            }

            return { blob: response.data as Blob, filename, contentType };
        } catch (err: any) {
            if (err.response && err.response.data) {
                try {
                    const text = await new Response(err.response.data).text();
                    throw new Error(text || err.message);
                } catch {
                    throw err;
                }
            }
            throw err;
        }
    },

    // Download from a full URL (useful for conversion result URLs)
    downloadBlobUrl: async (url: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const headers: Record<string, string> = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await axios.get(url, {
                responseType: 'blob',
                headers,
            });

            const contentType = response.headers['content-type'] || '';

            if (contentType.includes('application/json') || contentType.startsWith('text/')) {
                const text = await new Response(response.data).text();
                let msg = text;
                try {
                    const parsed = JSON.parse(text);
                    msg = parsed.detail || parsed.message || JSON.stringify(parsed);
                } catch { }
                throw new Error(msg || 'Download failed');
            }

            let filename = 'downloaded-file';
            const cd = response.headers['content-disposition'];
            if (cd) {
                const match = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i);
                if (match && match[1]) filename = decodeURIComponent(match[1]);
            }

            return { blob: response.data as Blob, filename, contentType };
        } catch (err: any) {
            if (err.response && err.response.data) {
                try {
                    const text = await new Response(err.response.data).text();
                    throw new Error(text || err.message);
                } catch {
                    throw err;
                }
            }
            throw err;
        }
    },

    delete: async (id: string) => {
        await api.delete(`/api/v1/documents/${id}`);
    },
};

// ============== Conversions API ==============

export const conversionsApi = {
    pdfToImages: async (documentId: string, options: { format?: string; dpi?: number } = {}) => {
        const response = await api.post('/api/v1/convert/pdf-to-images', {
            document_id: documentId,
            options,
        });
        return response.data;
    },

    imagesToPdf: async (documentIds: string[]) => {
        const response = await api.post('/api/v1/convert/images-to-pdf', documentIds);
        return response.data;
    },

    htmlToPdf: async (htmlContent?: string, url?: string, options = {}) => {
        const response = await api.post('/api/v1/convert/html-to-pdf', {
            html_content: htmlContent,
            url,
            options,
        });
        return response.data;
    },

    markdownToPdf: async (markdownContent: string, options = {}) => {
        const response = await api.post('/api/v1/convert/markdown-to-pdf', {
            markdown_content: markdownContent,
            options,
        });
        return response.data;
    },

    pdfToWord: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/pdf-to-word', { document_id: documentId });
        return response.data;
    },

    wordToPdf: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/word-to-pdf', { document_id: documentId });
        return response.data;
    },

    excelToPdf: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/excel-to-pdf', { document_id: documentId });
        return response.data;
    },

    pptToPdf: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/ppt-to-pdf', { document_id: documentId });
        return response.data;
    },

    pdfToCsv: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/pdf-to-csv', { document_id: documentId });
        return response.data;
    },

    pdfToXml: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/pdf-to-xml', { document_id: documentId });
        return response.data;
    },

    pdfToJson: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/pdf-to-json', { document_id: documentId });
        return response.data;
    },

    pdfToExcel: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/pdf-to-excel', { document_id: documentId });
        return response.data;
    },

    pdfToPpt: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/pdf-to-ppt', { document_id: documentId });
        return response.data;
    },

    pdfToText: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/pdf-to-text', { document_id: documentId });
        return response.data;
    },

    csvToPdf: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/csv-to-pdf', { document_id: documentId });
        return response.data;
    },

    jsonToPdf: async (documentId: string) => {
        const response = await api.post('/api/v1/convert/json-to-pdf', { document_id: documentId });
        return response.data;
    },

    getStatus: async (conversionId: string) => {
        const response = await api.get(`/api/v1/convert/${conversionId}/status`);
        return response.data;
    },

    downloadResult: (conversionId: string) => {
        return `${API_BASE_URL}/api/v1/convert/${conversionId}/download`;
    },
};

// ============== Editing API ==============

export const editingApi = {
    merge: async (documentIds: string[], outputFilename?: string) => {
        try {
            const response = await api.post('/api/v1/edit/merge', {
                document_ids: documentIds,
                output_filename: outputFilename,
            });
            return response.data;
        } catch (error: any) {
            if (error?.response?.status !== 404) {
                throw error;
            }

            // Legacy API fallback: synchronous merge via /api/convert.
            const [firstId, ...additionalIds] = documentIds;
            const response = await api.post('/api/convert', {
                file_id: firstId,
                conversion_type: 'merge_pdf',
                options: {
                    additional_file_ids: additionalIds,
                    output_filename: outputFilename,
                },
            });

            const data = response.data || {};
            return {
                id: data.output_file_id || data.id,
                status: data.status || 'completed',
                result_url: data.download_url
                    ? `${API_BASE_URL}${data.download_url}`
                    : undefined,
                _raw: data,
            };
        }
    },

    split: async (documentId: string, mode: 'pages' | 'range', pages?: number[], ranges?: string[]) => {
        const response = await api.post('/api/v1/edit/split', {
            document_id: documentId,
            mode,
            pages,
            ranges,
        });
        return response.data;
    },

    rotate: async (documentId: string, rotations: Record<number, number>) => {
        const response = await api.post('/api/v1/edit/rotate', {
            document_id: documentId,
            rotations,
        });
        return response.data;
    },

    reorder: async (documentId: string, newOrder: number[]) => {
        const response = await api.post('/api/v1/edit/reorder', {
            document_id: documentId,
            new_order: newOrder,
        });
        return response.data;
    },

    deletePages: async (documentId: string, pages: number[]) => {
        const response = await api.post('/api/v1/edit/delete-pages', {
            document_id: documentId,
            pages,
        });
        return response.data;
    },

    extractPages: async (documentId: string, pages: number[]) => {
        const response = await api.post('/api/v1/edit/extract-pages', {
            document_id: documentId,
            pages,
        });
        return response.data;
    },
};

// ============== Optimization API ==============

export const optimizationApi = {
    compress: async (documentId: string, quality: 'low' | 'medium' | 'high' = 'medium') => {
        const response = await api.post('/api/v1/optimize/compress', {
            document_id: documentId,
            quality,
        });
        return response.data;
    },

    linearize: async (documentId: string) => {
        const response = await api.post(`/api/v1/optimize/linearize?document_id=${documentId}`);
        return response.data;
    },
};

// ============== Security API ==============

export const securityApi = {
    protect: async (documentId: string, userPassword?: string, ownerPassword?: string, permissions?: string[]) => {
        const response = await api.post('/api/v1/security/protect', {
            document_id: documentId,
            user_password: userPassword,
            owner_password: ownerPassword,
            allow_printing: permissions?.includes('print') ?? true,
            allow_copying: permissions?.includes('copy') ?? false,
            allow_modification: permissions?.includes('modify') ?? false,
            allow_annotation: permissions?.includes('annotate') ?? true,
            allow_form_filling: true,
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
        const response = await api.post('/api/v1/security/watermark/text', {
            document_id: documentId,
            text,
            position: options.position || 'center',
            font_size: options.fontSize || 48,
            opacity: options.opacity || 0.3,
            rotation: options.rotation || 45,
            font_color: options.color || '#000000',
        });
        return response.data;
    },

    addImageWatermark: async (documentId: string, imageDocumentId: string, options: {
        position?: string;
        scale?: number;
        opacity?: number;
        pages?: string;
    } = {}) => {
        const response = await api.post('/api/v1/security/watermark/image', {
            document_id: documentId,
            watermark_image_id: imageDocumentId,
            position: options.position || 'center',
            scale: options.scale || 0.5,
            opacity: options.opacity || 0.3,
        });
        return response.data;
    },

    addPageNumbers: async (documentId: string, options: {
        position?: string;
        format?: string;
        fontSize?: number;
        startNumber?: number;
    } = {}) => {
        const response = await api.post('/api/v1/security/page-numbers', {
            document_id: documentId,
            position: options.position || 'bottom-center',
            format_string: options.format || 'Page {page} of {total}',
            font_size: options.fontSize || 10,
            start_page: options.startNumber || 1,
        });
        return response.data;
    },

    checkProtection: async (documentId: string) => {
        const response = await api.get(`/api/v1/security/check/${documentId}`);
        return response.data;
    },
    // Metadata endpoints removed from API; client methods omitted

    getThumbnails: async (documentId: string, pages?: string, size?: number) => {
        const params = new URLSearchParams();
        if (pages) params.append('pages', pages);
        if (size) params.append('size', size.toString());

        const response = await api.get(`/api/v1/security/thumbnails/${documentId}?${params}`);
        return response.data;
    },
};

export default api;
