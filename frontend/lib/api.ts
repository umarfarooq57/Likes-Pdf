/**
 * DocuForge API Client
 * Handles all API communication with backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export const extractErrorMessage = (error: any): string => {
    if (!error) return 'Something went wrong';
    if (typeof error === 'string') return error;

    // Check response status for friendly defaults
    if (error?.response?.status === 413) {
        return error.response.data?.detail || 'File is too large (maximum upload limit is 100MB).';
    }
    if (error?.response?.status === 429) {
        return error.response.data?.detail || 'Too many requests. Please wait a moment and try again.';
    }
    if (error?.response?.status === 401) {
        return 'Authentication required or session expired. Please log in.';
    }

    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        return detail
            .map((d: any) => d?.msg || (typeof d === 'object' ? JSON.stringify(d) : String(d)))
            .join(', ');
    }
    if (detail && typeof detail === 'object') {
        return detail.message || JSON.stringify(detail);
    }

    return (
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong. Please try again.'
    );
};

export const normalizeDownloadUrl = (url: string) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;

    const base = process.env.NEXT_PUBLIC_API_URL || resolveApiBaseUrl();
    if (!base) return url;

    if (url.startsWith('/')) {
        return `${base}${url}`;
    }
    return `${base}/${url}`;
};

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
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return Promise.reject(new Error('No internet connection. Please check your network.'));
        }

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

        const data = response.data || {};
        return {
            ...data,
            id: data.id || data.file_id || data.fileId,
        };
    },

    async downloadBlobUrl(url: string) {
        const response = await api.get(url, {
            responseType: 'blob',
        });

        // Extract filename from Content-Disposition header
        let filename = '';
        const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
            if (filenameMatch) {
                filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, '').trim());
            }
        }

        // If filename has no extension, try to infer from response blob type
        if (!filename.includes('.') && response.data?.type) {
            const type = response.data.type.toLowerCase();
            const mimeToExt: Record<string, string> = {
                'application/pdf': '.pdf',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
                'application/vnd.ms-excel': '.xls',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                'application/msword': '.doc',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
                'application/zip': '.zip',
                'image/png': '.png',
                'image/jpeg': '.jpg',
                'text/csv': '.csv',
                'text/plain': '.txt',
                'application/json': '.json',
            };
            const ext = mimeToExt[type];
            if (ext) {
                filename = filename ? `${filename}${ext}` : `download${ext}`;
            }
        }

        return {
            blob: response.data,
            filename,
        };
    },

    async uploadBatch(files: File[], onProgress?: (progress: number) => void) {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const response = await api.post('/api/upload/batch', formData, {
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
    /**
     * Merge multiple PDFs — delegates to the editing API endpoint.
     * @deprecated Use editingApi.merge() directly for clarity.
     */
    async merge(fileIds: string[]) {
        const response = await api.post('/api/v1/edit/merge', {
            document_ids: fileIds,  // Fixed: was 'file_ids' which backend rejected
        });
        return response.data;
    },

    async pdfToText(fileId: string) {
        try {
            const response = await api.post('/api/v1/convert/pdf-to-text', {
                document_id: fileId,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(extractErrorMessage(error));
        }
    },

    async pdfToWord(fileId: string) {
        try {
            const response = await api.post('/api/v1/convert/pdf-to-word', {
                document_id: fileId,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(extractErrorMessage(error));
        }
    },

    async pdfToExcel(fileId: string, options?: { extractTables?: boolean; preserveFormatting?: boolean }) {
        try {
            const response = await api.post('/api/v1/convert/pdf-to-excel', {
                document_id: fileId,
                options: {
                    extract_tables: options?.extractTables ?? true,
                    preserve_formatting: options?.preserveFormatting ?? true,
                },
            });
            return response.data;
        } catch (error: any) {
            throw new Error(extractErrorMessage(error));
        }
    },

    async pdfToCsv(fileId: string) {
        const response = await api.post('/api/v1/convert/pdf-to-csv', {
            document_id: fileId,
        });
        return response.data;
    },

    async pdfToJson(fileId: string) {
        const response = await api.post('/api/v1/convert/pdf-to-json', {
            document_id: fileId,
        });
        return response.data;
    },

    async pdfToXml(fileId: string) {
        const response = await api.post('/api/v1/convert/pdf-to-xml', {
            document_id: fileId,
        });
        return response.data;
    },

    async wordToPdf(fileId: string) {
        try {
            const response = await api.post('/api/v1/convert/word-to-pdf', {
                document_id: fileId,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(extractErrorMessage(error));
        }
    },

    async excelToPdf(fileId: string) {
        const response = await api.post('/api/v1/convert/excel-to-pdf', {
            document_id: fileId,
        });
        return response.data;
    },

    async csvToPdf(fileId: string) {
        const response = await api.post('/api/v1/convert/csv-to-pdf', {
            document_id: fileId,
        });
        return response.data;
    },

    async htmlToPdf(htmlContent?: string, url?: string) {
        const response = await api.post('/api/v1/convert/html-to-pdf', {
            html_content: htmlContent,
            url,
        });
        return response.data;
    },

    async jsonToPdf(fileId: string) {
        const response = await api.post('/api/v1/convert/json-to-pdf', {
            document_id: fileId,
        });
        return response.data;
    },

    async pptToPdf(fileId: string) {
        const response = await api.post('/api/v1/convert/ppt-to-pdf', {
            document_id: fileId,
        });
        return response.data;
    },

    async imagesToPdf(
        fileIds: string[],
        options?: {
            orientation?: string;
            pageSize?: string;
            margin?: string;
            rotations?: Record<string, number>;
        }
    ) {
        const payload = options
            ? {
                  document_ids: fileIds,
                  orientation: options.orientation || 'portrait',
                  page_size: options.pageSize || 'A4',
                  margin: options.margin || 'small',
                  rotations: options.rotations || {},
              }
            : fileIds;
        const response = await api.post('/api/v1/convert/images-to-pdf', payload);
        return response.data;
    },

    async pdfToImages(fileId: string, options?: { format?: string; dpi?: number }) {
        try {
            const response = await api.post('/api/v1/convert/pdf-to-images', {
                document_id: fileId,
                options,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(extractErrorMessage(error));
        }
    },
};

export const editingApi = {
    async merge(fileIds: string[]) {
        const response = await api.post('/api/v1/edit/merge', {
            document_ids: fileIds,
        });
        return response.data;
    },

    async deletePages(fileId: string, pageNumbers: number[]) {
        const response = await api.post('/api/v1/edit/delete-pages', {
            document_id: fileId,
            pages: pageNumbers,
        });
        return response.data;
    },

    async split(
        fileOrPayload: string | { file: string; pages?: number[]; ranges?: string },
        mode?: 'pages' | 'range',
        pages?: number[],
        ranges?: string[]
    ) {
        // Support both object-style { file, pages, ranges } and positional args
        let documentId: string;
        let resolvedMode: string;
        let resolvedPages: number[] | undefined;
        let resolvedRanges: string[] | undefined;

        if (typeof fileOrPayload === 'object') {
            // Object-style call
            documentId = fileOrPayload.file;
            const hasRanges = !!fileOrPayload.ranges?.trim();
            resolvedMode = hasRanges ? 'range' : 'pages';
            resolvedPages = fileOrPayload.pages;
            resolvedRanges = hasRanges
                ? fileOrPayload.ranges!.split(',').map((r) => r.trim()).filter(Boolean)
                : undefined;
        } else {
            // Positional-style call from split/page.tsx
            documentId = fileOrPayload;
            resolvedMode = mode || 'pages';
            resolvedPages = pages;
            resolvedRanges = ranges;
        }

        const response = await api.post('/api/v1/edit/split', {
            document_id: documentId,
            mode: resolvedMode,
            pages: resolvedPages,
            ranges: resolvedRanges,
        });
        return response.data;
    },

    async rotate(fileId: string, rotations: Record<number, number>) {
        const response = await api.post('/api/v1/edit/rotate', {
            document_id: fileId,
            rotations,
        });
        return response.data;
    },

    async reorder(fileId: string, pageOrder: number[]) {
        const response = await api.post('/api/v1/edit/reorder', {
            document_id: fileId,
            new_order: pageOrder,
        });
        return response.data;
    },

    async extractPages(fileId: string, pageNumbers: number[]) {
        try {
            const response = await api.post('/api/v1/edit/extract-pages', {
                document_id: fileId,
                pages: pageNumbers,
            });
            return response.data;
        } catch (error: any) {
            // Some deployments expose extract via split(mode=pages).
            if (error?.response?.status === 404) {
                const response = await api.post('/api/v1/edit/split', {
                    document_id: fileId,
                    mode: 'pages',
                    pages: pageNumbers,
                });
                return response.data;
            }
            throw error;
        }
    },

    async crop(
        fileId: string,
        margins: { left: number; top: number; right: number; bottom: number },
        pages?: number[]
    ) {
        const response = await api.post('/api/v1/edit/crop', {
            document_id: fileId,
            left: margins.left,
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            pages: pages ?? null,
        });
        return response.data;
    },
};

export const optimizationApi = {
    async compress(fileId: string, quality?: string) {
        const selectedQuality = quality || 'medium';

        try {
            // Modern backend route
            const response = await api.post('/api/v1/optimization/compress', {
                document_id: fileId,
                quality: selectedQuality,
            });
            return response.data;
        } catch (error: any) {
            // Legacy backend route used by some production deployments
            if (error?.response?.status === 404) {
                const response = await api.post('/api/v1/convert', {
                    file_id: fileId,
                    conversion_type: 'compress_pdf',
                    options: {
                        quality: selectedQuality,
                    },
                });
                return response.data;
            }
            throw error;
        }
    },
};

export const securityApi = {
    async addPassword(fileId: string, password: string) {
        const response = await api.post('/api/v1/security/protect', {
            document_id: fileId,
            user_password: password,
        });
        return response.data;
    },

    async removePassword(fileId: string, password: string) {
        const response = await api.post('/api/v1/security/unlock', {
            document_id: fileId,
            password,
        });
        return response.data;
    },

    async addWatermarkText(fileId: string, options: {
        text: string;
        fontSize?: number;
        fontColor?: string;
        opacity?: number;
        rotation?: number;
        position?: string;
    }) {
        const response = await api.post('/api/v1/security/watermark/text', {
            document_id: fileId,
            text: options.text,
            font_size: options.fontSize ?? 48,
            font_color: options.fontColor ?? '#808080',
            opacity: options.opacity ?? 0.3,
            rotation: options.rotation ?? 45.0,
            position: options.position ?? 'center',
        });
        return response.data;
    },

    async addPageNumbers(fileId: string, options: {
        position?: string;
        formatString?: string;
        fontSize?: number;
        startPage?: number;
        skipFirst?: boolean;
    } = {}) {
        const response = await api.post('/api/v1/security/page-numbers', {
            document_id: fileId,
            position: options.position ?? 'bottom-center',
            format_string: options.formatString ?? '{page} / {total}',
            font_size: options.fontSize ?? 10,
            start_page: options.startPage ?? 1,
            skip_first: options.skipFirst ?? false,
        });
        return response.data;
    },

    async getThumbnails(fileId: string, pages: 'all' | number[] = 'all', width = 150) {
        const response = await api.get(`/api/v1/security/thumbnails/${fileId}`, {
            params: {
                width,
            },
        });
        return response.data;
    },
};

export const authApi = {
    async login(username: string, password: string) {
        const body = new URLSearchParams();
        body.append('username', username);
        body.append('password', password);

        const response = await api.post('/api/v1/auth/login', body.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    },

    async register(email: string, password: string, fullName?: string) {
        const response = await api.post('/api/v1/auth/register', {
            email,
            password,
            full_name: fullName,
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
