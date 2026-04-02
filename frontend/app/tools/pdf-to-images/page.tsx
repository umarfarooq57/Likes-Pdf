'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, Image } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import toast from 'react-hot-toast';
import { documentsApi, conversionsApi } from '@/lib/api';

export default function PDFToImagesPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [format, setFormat] = useState<'png' | 'jpg'>('png');
    const [dpi, setDpi] = useState<number>(150);
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
            toast.success('File uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload file');
        }
    };

    const handleConvert = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        setIsProcessing(true);

        try {
            const result = await conversionsApi.pdfToImages(documentId, { format, dpi });
            setConversionId(result.id);
        } catch (error) {
            toast.error('Failed to start conversion');
            setIsProcessing(false);
        }
    };

    const handleComplete = (url: string) => {
        setResultUrl(url);
        setIsProcessing(false);
        toast.success('Conversion complete!');
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

    const dpiOptions = [
        { value: 72, label: 'Low (72 DPI)', desc: 'Small file size' },
        { value: 150, label: 'Medium (150 DPI)', desc: 'Balanced quality' },
        { value: 300, label: 'High (300 DPI)', desc: 'Print quality' },
    ];

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50">
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
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                        <Image className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF to Images</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Convert each page of your PDF to high-quality images. Choose between PNG and JPG formats.
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
                                        <p className="text-sm text-gray-500">Ready to convert</p>
                                    </div>
                                    <button
                                        onClick={resetTool}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Change file
                                    </button>
                                </div>
                            )}

                            {/* Conversion Options */}
                            {documentId && (
                                <div className="mt-8 space-y-6">
                                    {/* Format Selection */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                                            Image Format
                                        </h3>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setFormat('png')}
                                                className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${format === 'png'
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-900">PNG</p>
                                                <p className="text-sm text-gray-500">Lossless, transparent</p>
                                            </button>
                                            <button
                                                onClick={() => setFormat('jpg')}
                                                className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${format === 'jpg'
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-900">JPG</p>
                                                <p className="text-sm text-gray-500">Smaller file size</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* DPI Selection */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                                            Image Quality (DPI)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {dpiOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setDpi(option.value)}
                                                    className={`p-4 rounded-xl border-2 text-left transition-all ${dpi === option.value
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
                                </div>
                            )}

                            {/* Convert Button */}
                            {documentId && (
                                <button
                                    onClick={handleConvert}
                                    disabled={isProcessing}
                                    className="w-full mt-8 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Converting...
                                        </>
                                    ) : (
                                        <>
                                            <Image className="w-5 h-5" />
                                            Convert to {format.toUpperCase()}
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
                                        Download Images
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
