'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/api';

const API_V1_BASE_URL = '/api/v1';

const getStatusEndpoints = (conversionId: string) => [
    // Current backend route
    `${API_V1_BASE_URL}/jobs/${conversionId}/status`,
    // Legacy fallback route used by older deployments
    `${API_V1_BASE_URL}/convert/${conversionId}/status`,
];

interface ProgressTrackerProps {
    conversionId: string;
    onComplete?: (resultUrl: string) => void;
    onError?: (error: string) => void;
    showDownloadButton?: boolean;
}

interface ConversionStatus {
    id: string;
    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    current_step?: string;
    result_url?: string;
    download_url?: string;   // Also populated by sync editing/optimization endpoints
    result_filename?: string;
    error_message?: string;
}

export default function ProgressTracker({
    conversionId,
    onComplete,
    onError,
    showDownloadButton,
}: ProgressTrackerProps) {
    const [status, setStatus] = useState<ConversionStatus | null>(null);
    const [polling, setPolling] = useState(true);

    useEffect(() => {
        if (!conversionId || !polling) return;

        let errorCount = 0;

        const pollStatus = async () => {
            try {
                let response: Response | null = null;
                let lastErrorMessage = '';

                const headers: Record<string, string> = {};
                const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                for (const endpoint of getStatusEndpoints(conversionId)) {
                    response = await fetch(endpoint, { headers });
                    if (response.ok) {
                        break;
                    }

                    let detail = '';
                    try {
                        const payload = await response.json();
                        detail = payload?.detail || payload?.error || '';
                    } catch {
                        // Ignore JSON parsing failures for fallback logic.
                    }

                    lastErrorMessage = detail || `Status check failed (${response.status})`;

                    // Stop fallback for non-404 errors or meaningful 404s (e.g. job id not found).
                    if (response.status !== 404 || (detail && detail !== 'Not Found')) {
                        break;
                    }
                }

                if (!response || !response.ok) {
                    errorCount++;
                    const statusCode = response?.status ?? 'unknown';
                    const message = lastErrorMessage || `Status check failed (${statusCode})`;
                    // Tolerant polling: only give up after 30 consecutive failures to prevent aborting long conversions
                    if (errorCount >= 30) {
                        throw new Error(message);
                    }
                    return;
                }

                errorCount = 0; // Reset on success
                const data: ConversionStatus = await response.json();
                if (data.status === 'completed') {
                    data.progress = 100;
                    if (!data.result_url && !data.download_url) {
                        data.result_url = `${API_V1_BASE_URL}/convert/${conversionId}/download`;
                        data.download_url = data.result_url;
                    }
                }
                setStatus(data);

                if (data.status === 'completed') {
                    setPolling(false);
                    // Accept result_url or download_url, with deterministic fallback
                    const url = data.result_url || data.download_url || `${API_V1_BASE_URL}/convert/${conversionId}/download`;
                    if (onComplete) {
                        onComplete(url);
                    }
                } else if (data.status === 'failed') {
                    setPolling(false);
                    if (onError) {
                        onError(data.error_message || 'Conversion failed');
                    }
                }
            } catch (error) {
                const message = extractErrorMessage(error) || 'Failed to poll conversion status';
                console.error('Failed to poll status:', error);
                if (onError) {
                    onError(message);
                }
                setPolling(false);
            }
        };

        // Fast responsive polling: immediate, then fast (500ms-800ms) for snappy UI
        let isMounted = true;
        let timer: NodeJS.Timeout;
        let pollInterval = 500;

        const schedulePoll = async () => {
            if (!isMounted || !polling) return;
            await pollStatus();
            if (isMounted && polling) {
                pollInterval = Math.min(pollInterval + 50, 1000);
                timer = setTimeout(schedulePoll, pollInterval);
            }
        };

        // Fire first poll immediately
        schedulePoll();

        return () => {
            isMounted = false;
            if (timer) clearTimeout(timer);
        };
    }, [conversionId, polling, onComplete, onError]);

    if (!status) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            {/* Status Icon */}
            <div className="flex items-center justify-center mb-6">
                {status.status === 'completed' ? (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
                    >
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </motion.div>
                ) : status.status === 'failed' ? (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"
                    >
                        <XCircle className="w-8 h-8 text-red-500" />
                    </motion.div>
                ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                )}
            </div>

            {/* Status Text */}
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
                {status.status === 'completed' && 'Conversion Complete!'}
                {status.status === 'failed' && 'Conversion Failed'}
                {status.status === 'processing' && 'Processing...'}
                {status.status === 'queued' && 'Queued...'}
                {status.status === 'pending' && 'Preparing...'}
            </h3>

            {status.current_step && status.status !== 'completed' && (
                <p className="text-center text-gray-500 mb-4">{status.current_step}</p>
            )}

            {status.error_message && (
                <p className="text-center text-red-500 text-sm mb-4">{status.error_message}</p>
            )}

            {/* Progress Bar */}
            {status.status !== 'completed' && status.status !== 'failed' && (
                <div className="w-full">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>Progress</span>
                        <span>{status.progress}%</span>
                    </div>
                    <div className="progress-bar">
                        <motion.div
                            className="progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${status.progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
            )}

            {/* Download Button (fallback when parent does not handle download UI) */}
            {status.status === 'completed' && status.result_url && (showDownloadButton ?? !onComplete) && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={async () => {
                        try {
                            const api = await import('@/lib/api');
                            const { blob, filename } = await api.documentsApi.downloadBlobUrl(status.result_url!);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = filename || 'result';
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                        } catch (err: any) {
                            console.error('Download failed', err);
                            window.open(status.result_url, '_blank');
                        }
                    }}
                    className="block w-full mt-6 btn-primary text-center"
                >
                    Download Result
                </motion.button>
            )}
        </div>
    );
}
