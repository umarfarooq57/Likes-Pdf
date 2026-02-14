'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, Zap } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import toast from 'react-hot-toast';
import { documentsApi, optimizationApi } from '@/lib/api';

export default function CompressPDFPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversionId, setConversionId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];

        try {
            const result = await documentsApi.upload(file);
            setDocumentId(result.id);
            setFileName(result.filename);
            toast.success('File uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload file');
        }
    };

    const handleCompress = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        setIsProcessing(true);

        try {
            const result = await optimizationApi.compress(documentId, quality);
            setConversionId(result.id);
        } catch (error) {
            toast.error('Failed to start compression');
            setIsProcessing(false);
        }
    };

    const handleComplete = (url: string) => {
        setResultUrl(url);
        setIsProcessing(false);
        toast.success('Compression complete!');
    };

    const handleError = (error: string) => {
        setIsProcessing(false);
        toast.error(error);
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setConversionId(null);
        setResultUrl(null);
        setIsProcessing(false);
    };

    const qualityOptions = [
        { value: 'low', label: 'Maximum Compression', desc: 'Smallest file size, lower quality' },
        { value: 'medium', label: 'Balanced', desc: 'Good balance of size and quality' },
        { value: 'high', label: 'High Quality', desc: 'Best quality, moderate compression' },
    ];

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
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
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Back Link */}
                <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tools
                </Link>

                {/* Tool Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <Zap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Compress PDF</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Reduce your PDF file size while maintaining quality. Perfect for email attachments and web uploads.
                    </p>
                </div>

                {/* Main Content */}
                <div className="card">
                    {!conversionId ? (
                        <>
                            {/* File Upload */}
                            {!documentId ? (
                                <FileDropzone
                                    accept={{ 'application/pdf': ['.pdf'] }}
                                    onFilesSelected={handleFilesSelected}
                                    multiple={false}
                                />
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{fileName}</p>
                                        <p className="text-sm text-gray-500">Ready to compress</p>
                                    </div>
                                    <button
                                        onClick={resetTool}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Change file
                                    </button>
                                </div>
                            )}

                            {/* Quality Selection */}
                            {documentId && (
                                <div className="mt-8">
                                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                                        Compression Level
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {qualityOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setQuality(option.value as any)}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${quality === option.value
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-900">{option.label}</p>
                                                <p className="text-sm text-gray-500">{option.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Compress Button */}
                            {documentId && (
                                <button
                                    onClick={handleCompress}
                                    disabled={isProcessing}
                                    className="w-full mt-8 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Compressing...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5" />
                                            Compress PDF
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Progress / Result */}
                            <ProgressTracker
                                conversionId={conversionId}
                                onComplete={handleComplete}
                                onError={handleError}
                            />

                            {resultUrl && (
                                <div className="mt-6 flex gap-4">
                                    <a
                                        href={resultUrl}
                                        download
                                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Compressed PDF
                                    </a>
                                    <button
                                        onClick={resetTool}
                                        className="btn-secondary"
                                    >
                                        Compress Another
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
