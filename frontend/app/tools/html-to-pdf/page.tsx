'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, Globe } from 'lucide-react';
import ProgressTracker from '@/components/ProgressTracker';
import toast from 'react-hot-toast';
import { conversionsApi } from '@/lib/api';

export default function HTMLToPDFPage() {
    const [mode, setMode] = useState<'url' | 'html'>('url');
    const [url, setUrl] = useState<string>('');
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversionId, setConversionId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const handleConvert = async () => {
        if (mode === 'url' && !url.trim()) {
            toast.error('Please enter a URL');
            return;
        }
        if (mode === 'html' && !htmlContent.trim()) {
            toast.error('Please enter HTML content');
            return;
        }

        setIsProcessing(true);

        try {
            const result = await conversionsApi.htmlToPdf(
                mode === 'html' ? htmlContent : undefined,
                mode === 'url' ? url : undefined
            );
            setConversionId(result.id);
        } catch (error) {
            toast.error('Failed to start conversion');
            setIsProcessing(false);
        }
    };

    const handleComplete = (completeUrl: string) => {
        setResultUrl(completeUrl);
        setIsProcessing(false);
        toast.success('Conversion complete!');
    };

    const handleError = (error: string) => {
        setIsProcessing(false);
        toast.error(error);
    };

    const resetTool = () => {
        setUrl('');
        setHtmlContent('');
        setConversionId(null);
        setResultUrl(null);
        setIsProcessing(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
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
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                        <Globe className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">HTML to PDF</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Convert any webpage or HTML content to a PDF document. Perfect for saving web pages offline.
                    </p>
                </div>

                {/* Main Content */}
                <div className="card">
                    {!conversionId ? (
                        <>
                            {/* Mode Selection */}
                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={() => setMode('url')}
                                    className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${mode === 'url'
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <p className="font-medium text-gray-900">Website URL</p>
                                    <p className="text-sm text-gray-500">Convert any webpage</p>
                                </button>
                                <button
                                    onClick={() => setMode('html')}
                                    className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${mode === 'html'
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <p className="font-medium text-gray-900">HTML Code</p>
                                    <p className="text-sm text-gray-500">Paste your own HTML</p>
                                </button>
                            </div>

                            {/* URL Input */}
                            {mode === 'url' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Website URL
                                    </label>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <p className="mt-2 text-sm text-gray-500">
                                        Enter the full URL including https://
                                    </p>
                                </div>
                            )}

                            {/* HTML Input */}
                            {mode === 'html' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        HTML Content
                                    </label>
                                    <textarea
                                        value={htmlContent}
                                        onChange={(e) => setHtmlContent(e.target.value)}
                                        placeholder="<html>&#10;  <body>&#10;    <h1>Hello World</h1>&#10;  </body>&#10;</html>"
                                        rows={10}
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                                    />
                                </div>
                            )}

                            {/* Convert Button */}
                            <button
                                onClick={handleConvert}
                                disabled={isProcessing || (mode === 'url' ? !url.trim() : !htmlContent.trim())}
                                className="w-full mt-8 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Converting...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5" />
                                        Convert to PDF
                                    </>
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
                                    <a
                                        href={resultUrl}
                                        download
                                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download PDF
                                    </a>
                                    <button
                                        onClick={resetTool}
                                        className="btn-secondary"
                                    >
                                        Convert Another
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
