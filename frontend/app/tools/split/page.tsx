'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, Scissors } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import toast from 'react-hot-toast';
import { documentsApi, editingApi, conversionsApi } from '@/lib/api';

export default function SplitPDFPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [pageCount, setPageCount] = useState<number>(0);
    const [mode, setMode] = useState<'pages' | 'range'>('pages');
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [ranges, setRanges] = useState<string>('');
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
            setPageCount(result.page_count || 10); // Default to 10 if not provided
            toast.success('File uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload file');
        }
    };

    const togglePage = (page: number) => {
        setSelectedPages(prev =>
            prev.includes(page)
                ? prev.filter(p => p !== page)
                : [...prev, page].sort((a, b) => a - b)
        );
    };

    const handleSplit = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        if (mode === 'pages' && selectedPages.length === 0) {
            toast.error('Please select at least one page');
            return;
        }

        if (mode === 'range' && !ranges.trim()) {
            toast.error('Please enter page ranges');
            return;
        }

        setIsProcessing(true);

        try {
            const rangeArray = mode === 'range'
                ? ranges.split(',').map(r => r.trim())
                : undefined;

            const result = await editingApi.split(
                documentId,
                mode,
                mode === 'pages' ? selectedPages : undefined,
                rangeArray
            );
            setConversionId(result.id);
        } catch (error) {
            toast.error('Failed to start split process');
            setIsProcessing(false);
        }
    };

    const handleComplete = (url: string) => {
        setResultUrl(url);
        setIsProcessing(false);
        toast.success('Split complete!');
    };

    const handleError = (error: string) => {
        setIsProcessing(false);
        toast.error(error);
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setPageCount(0);
        setSelectedPages([]);
        setRanges('');
        setConversionId(null);
        setResultUrl(null);
        setIsProcessing(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
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
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <Scissors className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Split PDF</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Split your PDF into multiple documents. Select specific pages or define custom ranges.
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
                                        <p className="text-sm text-gray-500">{pageCount} pages</p>
                                    </div>
                                    <button
                                        onClick={resetTool}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Change file
                                    </button>
                                </div>
                            )}

                            {/* Split Options */}
                            {documentId && (
                                <div className="mt-8">
                                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                                        Split Mode
                                    </h3>
                                    <div className="flex gap-4 mb-6">
                                        <button
                                            onClick={() => setMode('pages')}
                                            className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${mode === 'pages'
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <p className="font-medium text-gray-900">Select Pages</p>
                                            <p className="text-sm text-gray-500">Pick individual pages</p>
                                        </button>
                                        <button
                                            onClick={() => setMode('range')}
                                            className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${mode === 'range'
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <p className="font-medium text-gray-900">Page Ranges</p>
                                            <p className="text-sm text-gray-500">e.g., 1-3, 5-7</p>
                                        </button>
                                    </div>

                                    {mode === 'pages' ? (
                                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                            {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => togglePage(page)}
                                                    className={`p-3 rounded-lg text-center font-medium transition-all ${selectedPages.includes(page)
                                                        ? 'bg-primary-500 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={ranges}
                                            onChange={(e) => setRanges(e.target.value)}
                                            placeholder="e.g., 1-3, 5-7, 10-15"
                                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    )}
                                </div>
                            )}

                            {/* Split Button */}
                            {documentId && (
                                <button
                                    onClick={handleSplit}
                                    disabled={isProcessing}
                                    className="w-full mt-8 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Scissors className="w-5 h-5" />
                                            Split PDF
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
                                        Download Split PDFs
                                    </a>
                                    <button
                                        onClick={resetTool}
                                        className="btn-secondary"
                                    >
                                        Split Another
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
