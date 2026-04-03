'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2 } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import DownloadButton from '@/components/DownloadButton';
import toast from 'react-hot-toast';
import { documentsApi, editingApi } from '@/lib/api';

interface UploadedFile {
    id: string;
    filename: string;
    size: number;
}

export default function MergePDFPage() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversionId, setConversionId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const handleFilesSelected = async (selectedFiles: File[]) => {
        // Upload each file
        for (const file of selectedFiles) {
            try {
                const result = await documentsApi.upload(file);
                setFiles((prev) => [
                    ...prev,
                    { id: result.id || `temp-${Date.now()}`, filename: result.filename, size: result.size },
                ]);
                toast.success(`${file.name} uploaded`);
            } catch (error) {
                toast.error(`Failed to upload ${file.name}`);
            }
        }
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error('Please upload at least 2 PDF files');
            return;
        }

        setIsProcessing(true);

        try {
            const documentIds = files.map((f) => f.id);
            const result = await editingApi.merge(documentIds);

            // Legacy backend may return completed result_url immediately.
            if (result.result_url) {
                setResultUrl(result.result_url);
                setIsProcessing(false);
                toast.success('Merge complete!');
                return;
            }

            setConversionId(result.id);
        } catch (error) {
            toast.error('Failed to start merge process');
            setIsProcessing(false);
        }
    };

    const handleComplete = (url: string) => {
        setResultUrl(url);
        setIsProcessing(false);
        toast.success('Merge complete!');
    };

    const handleError = (error: string) => {
        setIsProcessing(false);
        toast.error(error);
    };

    const resetTool = () => {
        setFiles([]);
        setConversionId(null);
        setResultUrl(null);
        setIsProcessing(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Merge PDF</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Combine multiple PDF files into a single document. Drag to reorder files before merging.
                    </p>
                </div>

                {/* Main Content */}
                <div className="card">
                    {!conversionId ? (
                        <>
                            {/* File Upload */}
                            <FileDropzone
                                accept={{ 'application/pdf': ['.pdf'] }}
                                onFilesSelected={handleFilesSelected}
                                multiple={true}
                            />

                            {/* File List */}
                            {files.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                                        Files to merge ({files.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {files.map((file, index) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                            >
                                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium flex items-center justify-center">
                                                    {index + 1}
                                                </span>
                                                <span className="flex-1 text-gray-700 truncate">
                                                    {file.filename}
                                                </span>
                                                <span className="text-sm text-gray-400">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Merge Button */}
                            <button
                                onClick={handleMerge}
                                disabled={files.length < 2 || isProcessing}
                                className="w-full mt-8 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>Merge {files.length} PDFs</>
                                )}
                            </button>
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
                                    <DownloadButton url={resultUrl} fallbackName="merged.pdf" className="flex-1 btn-primary flex items-center justify-center gap-2">
                                        <Download className="w-5 h-5" />
                                        Download Merged PDF
                                    </DownloadButton>
                                    <button
                                        onClick={resetTool}
                                        className="btn-secondary"
                                    >
                                        Merge More
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
