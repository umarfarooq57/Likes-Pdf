'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, Download, FolderOpen, Check, X, Upload } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi, conversionsApi } from '@/lib/api';

interface BatchFile {
    id: string;
    file: File;
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    downloadUrl?: string;
    error?: string;
}

type ConversionType = 'pdf-to-word' | 'pdf-to-excel' | 'pdf-to-images' | 'word-to-pdf' | 'images-to-pdf' | 'compress';

export default function BatchConvertPage() {
    const [files, setFiles] = useState<BatchFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversionType, setConversionType] = useState<ConversionType>('pdf-to-word');
    const [isCompleted, setIsCompleted] = useState(false);

    const conversionTypes = [
        { id: 'pdf-to-word', label: 'PDF → Word', accept: ['application/pdf'] },
        { id: 'pdf-to-excel', label: 'PDF → Excel', accept: ['application/pdf'] },
        { id: 'pdf-to-images', label: 'PDF → Images', accept: ['application/pdf'] },
        { id: 'word-to-pdf', label: 'Word → PDF', accept: ['.doc', '.docx'] },
        { id: 'images-to-pdf', label: 'Images → PDF', accept: ['image/*'] },
        { id: 'compress', label: 'Compress PDFs', accept: ['application/pdf'] },
    ];

    const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
        const newFiles: BatchFile[] = selectedFiles.map((file) => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            status: 'pending' as const,
        }));
        setFiles((prev) => [...prev, ...newFiles]);
        toast.success(`${selectedFiles.length} file(s) added`);
    }, []);

    const removeFile = (id: string) => {
        setFiles(files.filter((f) => f.id !== id));
    };

    const handleBatchProcess = async () => {
        if (files.length === 0) {
            toast.error('Please add files first');
            return;
        }

        setIsProcessing(true);

        // Process files one by one (simulated)
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === file.id ? { ...f, status: 'processing' } : f
                )
            );

            try {
                // Simulated processing
                await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === file.id
                            ? {
                                ...f,
                                status: 'completed',
                                downloadUrl: `http://localhost:8000/api/v1/convert/${f.id}/download`,
                            }
                            : f
                    )
                );
            } catch (error) {
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === file.id
                            ? { ...f, status: 'error', error: 'Conversion failed' }
                            : f
                    )
                );
            }
        }

        setIsProcessing(false);
        setIsCompleted(true);
        toast.success('Batch processing complete!');
    };

    const downloadAll = () => {
        files
            .filter((f) => f.status === 'completed' && f.downloadUrl)
            .forEach((f) => {
                const a = document.createElement('a');
                a.href = f.downloadUrl!;
                a.download = f.name;
                a.click();
            });
    };

    const resetTool = () => {
        setFiles([]);
        setIsCompleted(false);
    };

    const completedCount = files.filter((f) => f.status === 'completed').length;
    const errorCount = files.filter((f) => f.status === 'error').length;

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">DocuForge</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-12">
                <Link href="/tools" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tools
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 mb-6">
                        <FolderOpen className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Batch Convert</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Convert multiple files at once. Select your conversion type and upload your files.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Conversion Type Selection */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-4">Conversion Type</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {conversionTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        setConversionType(type.id as ConversionType);
                                        setFiles([]);
                                    }}
                                    disabled={isProcessing}
                                    className={`p-3 rounded-xl font-medium transition-all ${conversionType === type.id
                                            ? 'bg-violet-100 text-violet-700 border-2 border-violet-500'
                                            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-violet-200'
                                        } disabled:opacity-50`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Upload Section */}
                    {!isCompleted && (
                        <FileDropzone
                            onFilesSelected={handleFilesSelected}
                            maxFiles={50}
                            acceptedTypes={conversionTypes.find((t) => t.id === conversionType)?.accept || ['*']}
                        />
                    )}

                    {/* Files List */}
                    {files.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">
                                    Files ({files.length})
                                </h3>
                                {isCompleted && (
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-green-600">
                                            {completedCount} completed
                                        </span>
                                        {errorCount > 0 && (
                                            <span className="text-sm text-red-600">
                                                {errorCount} failed
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                                {files.map((file) => (
                                    <div key={file.id} className="p-4 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file.status === 'completed'
                                                ? 'bg-green-100'
                                                : file.status === 'error'
                                                    ? 'bg-red-100'
                                                    : file.status === 'processing'
                                                        ? 'bg-violet-100'
                                                        : 'bg-gray-100'
                                            }`}>
                                            {file.status === 'completed' ? (
                                                <Check className="w-5 h-5 text-green-600" />
                                            ) : file.status === 'error' ? (
                                                <X className="w-5 h-5 text-red-600" />
                                            ) : file.status === 'processing' ? (
                                                <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                                            ) : (
                                                <FileText className="w-5 h-5 text-gray-600" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className={`text-sm ${file.status === 'completed'
                                                    ? 'text-green-600'
                                                    : file.status === 'error'
                                                        ? 'text-red-600'
                                                        : file.status === 'processing'
                                                            ? 'text-violet-600'
                                                            : 'text-gray-500'
                                                }`}>
                                                {file.status === 'completed'
                                                    ? 'Completed'
                                                    : file.status === 'error'
                                                        ? file.error
                                                        : file.status === 'processing'
                                                            ? 'Processing...'
                                                            : 'Pending'}
                                            </p>
                                        </div>

                                        {file.status === 'completed' && file.downloadUrl && (
                                            <a
                                                href={file.downloadUrl}
                                                download
                                                className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg"
                                            >
                                                <Download className="w-5 h-5" />
                                            </a>
                                        )}

                                        {!isProcessing && file.status === 'pending' && (
                                            <button
                                                onClick={() => removeFile(file.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {!isCompleted ? (
                        <button
                            onClick={handleBatchProcess}
                            disabled={isProcessing || files.length === 0}
                            className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing {files.filter((f) => f.status === 'completed').length + 1}/{files.length}...
                                </span>
                            ) : (
                                `Convert ${files.length} File${files.length !== 1 ? 's' : ''}`
                            )}
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={downloadAll}
                                disabled={completedCount === 0}
                                className="flex-1 py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Download All ({completedCount})
                            </button>
                            <button
                                onClick={resetTool}
                                className="px-6 py-4 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                            >
                                Start New Batch
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
