/**
 * DocuForge API Client
 * Handles all API communication with backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const extractErrorMessage = (error: any) => {
    return error?.response?.data?.detail
        || error?.response?.data?.error
        || error?.message
        || 'Request failed';
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
    async merge(fileIds: string[]) {
        const response = await api.post('/api/v1/conversions/merge', {
            file_ids: fileIds,
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

    async pdfToExcel(fileId: string) {
        try {
            const response = await api.post('/api/v1/convert/pdf-to-excel', {
                document_id: fileId,
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

    async imagesToPdf(fileIds: string[]) {
        const response = await api.post('/api/v1/convert/images-to-pdf', fileIds);
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
        try {
            const [firstFileId, ...restFileIds] = fileIds;
            const fallback = await api.post('/api/convert', {
                file_id: firstFileId,
                conversion_type: 'merge_pdf',
                options: {
                    additional_file_ids: restFileIds,
                },
            });
            const data = fallback.data || {};
            return {
                ...data,
                id: data.id || data.output_file_id,
                result_url: data.result_url || data.download_url,
            };
        } catch (error: any) {
            // Newer backend exposes /api/v1/edit/merge.
            if (error?.response?.status === 404) {
                const response = await api.post('/api/v1/edit/merge', {
                    document_ids: fileIds,
                });
                return response.data;
            }
            throw error;
        }
    },

    async deletePages(fileId: string, pageNumbers: number[]) {
        const response = await api.post('/api/v1/edit/delete-pages', {
            file_id: fileId,
            pages: pageNumbers,
        });
        return response.data;
    },

    async split(
        fileId: string,
        mode: 'pages' | 'range',
        pages?: number[],
        ranges?: string[]
    ) {
        const response = await api.post('/api/v1/edit/split', {
            document_id: fileId,
            mode,
            pages,
            ranges,
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
