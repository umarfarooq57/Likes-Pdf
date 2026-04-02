'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, FileOutput } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import toast from 'react-hot-toast';
import { documentsApi, editingApi } from '@/lib/api';

export default function ExtractPagesPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [pageCount, setPageCount] = useState<number>(0);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversionId, setConversionId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];

        try {
            const result = await documentsApi.upload(file);
            setDocumentId(result.id || null);
            setFileName(result.filename);
            setPageCount(10);
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

    const handleExtract = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        if (selectedPages.length === 0) {
            toast.error('Please select pages to extract');
            return;
        }

        setIsProcessing(true);

        try {
            const result = await editingApi.extractPages(documentId, selectedPages);
            setConversionId(result.id);
        } catch (error) {
            toast.error('Failed to extract pages');
            setIsProcessing(false);
        }
    };

    const handleComplete = (url: string) => {
        setResultUrl(url);
        setIsProcessing(false);
        toast.success('Pages extracted successfully!');
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
        setConversionId(null);
        setResultUrl(null);
        setIsProcessing(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
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
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <FileOutput className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Extract Pages</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Extract specific pages from your PDF into a new document. Select the pages you want to keep.
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

                            {/* Page Selection */}
                            {documentId && (
                                <div className="mt-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-medium text-gray-700">
                                            Select Pages to Extract
                                        </h3>
                                        <span className="text-sm text-indigo-500 font-medium">
                                            {selectedPages.length} selected
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                        {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => togglePage(page)}
                                                className={`p-3 rounded-lg text-center font-medium transition-all ${selectedPages.includes(page)
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedPages.length > 0 && (
                                        <p className="mt-4 text-sm text-gray-500">
                                            Pages to extract: {selectedPages.join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Extract Button */}
                            {documentId && (
                                <button
                                    onClick={handleExtract}
                                    disabled={isProcessing || selectedPages.length === 0}
                                    className="w-full mt-8 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Extracting...
                                        </>
                                    ) : (
                                        <>
                                            <FileOutput className="w-5 h-5" />
                                            Extract {selectedPages.length} Page{selectedPages.length !== 1 ? 's' : ''}
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
                                        Download Extracted PDF
                                    </a>
                                    <button
                                        onClick={resetTool}
                                        className="btn-secondary"
                                    >
                                        Extract More
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
