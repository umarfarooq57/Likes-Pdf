'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    Download,
    ArrowLeft,
    Loader2,
    File,
    Trash2,
    GripVertical,
} from 'lucide-react';
import { clsx } from 'clsx';

interface UploadedFile {
    id: string;
    file: File;
    preview?: string;
    status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
    documentId?: string;
}

interface ToolLayoutProps {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    acceptedFormats?: string[];
    maxFiles?: number;
    children?: React.ReactNode;
    onProcess?: (files: UploadedFile[]) => Promise<{ downloadUrl: string; filename: string }>;
    options?: React.ReactNode;
    showReorder?: boolean;
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function ToolLayout({
    title,
    description,
    icon: Icon,
    iconColor,
    acceptedFormats = ['application/pdf'],
    maxFiles = 20,
    children,
    onProcess,
    options,
    showReorder = false,
}: ToolLayoutProps) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ downloadUrl: string; filename: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map((file) => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            status: 'idle' as const,
            progress: 0,
        }));
        setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
        setResult(null);
        setError(null);
    }, [maxFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedFormats.reduce((acc, format) => {
            if (format === 'application/pdf') {
                acc['application/pdf'] = ['.pdf'];
            } else if (format.startsWith('image/')) {
                acc[format] = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            }
            return acc;
        }, {} as Record<string, string[]>),
        maxFiles,
    });

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const clearAll = () => {
        setFiles([]);
        setResult(null);
        setError(null);
    };

    const handleProcess = async () => {
        if (!onProcess || files.length === 0) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Update all files to processing state
            setFiles((prev) =>
                prev.map((f) => ({ ...f, status: 'processing' as const, progress: 50 }))
            );

            const result = await onProcess(files);

            setFiles((prev) =>
                prev.map((f) => ({ ...f, status: 'completed' as const, progress: 100 }))
            );

            setResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setFiles((prev) =>
                prev.map((f) => ({ ...f, status: 'error' as const }))
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const moveFile = (fromIndex: number, toIndex: number) => {
        setFiles((prev) => {
            const updated = [...prev];
            const [removed] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, removed);
            return updated;
        });
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">DocuForge</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/tools" className="text-gray-600 hover:text-gray-900">All Tools</Link>
                            <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                            <Link href="/register" className="btn-primary">Get Started</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Link */}
                <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    All Tools
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${iconColor} flex items-center justify-center`}>
                        <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        {title}
                    </h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        {description}
                    </p>
                </div>

                {/* Upload Area */}
                {!result && (
                    <div
                        {...getRootProps()}
                        className={clsx(
                            'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all',
                            isDragActive
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                        )}
                    >
                        <input {...getInputProps()} />
                        <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {isDragActive ? 'Drop files here' : 'Drop files here or click to upload'}
                        </h3>
                        <p className="text-gray-500">
                            Supports PDF files up to 100MB
                        </p>
                    </div>
                )}

                {/* File List */}
                <AnimatePresence>
                    {files.length > 0 && !result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-900">
                                    {files.length} file{files.length > 1 ? 's' : ''} selected
                                </h3>
                                <button
                                    onClick={clearAll}
                                    className="text-sm text-red-600 hover:text-red-700"
                                >
                                    Clear all
                                </button>
                            </div>

                            <div className="space-y-2">
                                {files.map((file, index) => (
                                    <motion.div
                                        key={file.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                                    >
                                        {showReorder && (
                                            <div className="cursor-grab text-gray-400">
                                                <GripVertical className="w-4 h-4" />
                                            </div>
                                        )}
                                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <File className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {file.file.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatBytes(file.file.size)}
                                            </p>
                                        </div>
                                        {file.status === 'processing' && (
                                            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                                        )}
                                        {file.status === 'completed' && (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        )}
                                        {file.status === 'error' && (
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        )}
                                        {file.status === 'idle' && (
                                            <button
                                                onClick={() => removeFile(file.id)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                            >
                                                <X className="w-4 h-4 text-gray-400" />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Options */}
                            {options && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                                    {options}
                                </div>
                            )}

                            {/* Process Button */}
                            <button
                                onClick={handleProcess}
                                disabled={isProcessing || files.length === 0}
                                className={clsx(
                                    'w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all',
                                    isProcessing || files.length === 0
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg'
                                )}
                            >
                                {isProcessing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    `Process ${files.length} file${files.length > 1 ? 's' : ''}`
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </motion.div>
                )}

                {/* Result */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6"
                    >
                        <div className="text-center p-8 bg-green-50 rounded-2xl border border-green-100">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Success!
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Your file is ready for download
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href={result.downloadUrl}
                                    download={result.filename}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                                >
                                    <Download className="w-5 h-5" />
                                    Download {result.filename}
                                </a>
                                <button
                                    onClick={clearAll}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Process more files
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Custom Content */}
                {children}
            </div>

            {/* Footer */}
            <footer className="py-8 px-4 mt-auto">
                <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
                    <p>Your files are processed securely and deleted automatically after 1 hour.</p>
                </div>
            </footer>
        </main>
    );
}
