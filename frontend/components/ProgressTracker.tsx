'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '').endsWith('/api/v1')
    ? RAW_API_BASE_URL.replace(/\/+$/, '')
    : `${RAW_API_BASE_URL.replace(/\/+$/, '')}/api/v1`;

interface ProgressTrackerProps {
    conversionId: string;
    onComplete?: (resultUrl: string) => void;
    onError?: (error: string) => void;
}

interface ConversionStatus {
    id: string;
    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    current_step?: string;
    result_url?: string;
    error_message?: string;
}

export default function ProgressTracker({
    conversionId,
    onComplete,
    onError,
}: ProgressTrackerProps) {
    const [status, setStatus] = useState<ConversionStatus | null>(null);
    const [polling, setPolling] = useState(true);

    useEffect(() => {
        if (!conversionId || !polling) return;

        const pollStatus = async () => {
            try {
                const response = await fetch(`${API_V1_BASE_URL}/convert/${conversionId}/status`);
                const data: ConversionStatus = await response.json();
                setStatus(data);

                if (data.status === 'completed') {
                    setPolling(false);
                    if (onComplete && data.result_url) {
                        onComplete(data.result_url);
                    }
                } else if (data.status === 'failed') {
                    setPolling(false);
                    if (onError) {
                        onError(data.error_message || 'Conversion failed');
                    }
                }
            } catch (error) {
                console.error('Failed to poll status:', error);
            }
        };

        // Poll immediately, then every 2 seconds
        pollStatus();
        const interval = setInterval(pollStatus, 2000);

        return () => clearInterval(interval);
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

            {/* Download Button */}
            {status.status === 'completed' && status.result_url && (
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
