'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, RotateCw } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import DownloadButton from '@/components/DownloadButton';
import toast from 'react-hot-toast';
import { documentsApi, editingApi, extractErrorMessage } from '@/lib/api';

export default function RotatePDFPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [pageCount, setPageCount] = useState<number>(0);
    const [rotations, setRotations] = useState<Record<number, number>>({});
    const [globalRotation, setGlobalRotation] = useState<number>(90);
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
            setPageCount(result.page_count ?? 1);
            toast.success('File uploaded successfully');
        } catch (error) {
            toast.error(extractErrorMessage(error));
        }
    };

    const setPageRotation = (page: number, degrees: number) => {
        setRotations(prev => ({
            ...prev,
            [page]: degrees
        }));
    };

    const rotateAllPages = () => {
        const newRotations: Record<number, number> = {};
        for (let i = 1; i <= pageCount; i++) {
            newRotations[i] = globalRotation;
        }
        setRotations(newRotations);
        toast.success(`All pages set to ${globalRotation}°`);
    };

    const handleRotate = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        if (Object.keys(rotations).length === 0) {
            toast.error('Please select rotation for at least one page');
            return;
        }

        setIsProcessing(true);

        try {
            const result = await editingApi.rotate(documentId, rotations);
            setConversionId(result.id);
        } catch (error) {
            toast.error(extractErrorMessage(error));
            setIsProcessing(false);
        }
    };

    const handleComplete = (url: string) => {
        setResultUrl(url);
        setIsProcessing(false);
        toast.success('Rotation complete!');
    };

    const handleError = (error: string) => {
        setIsProcessing(false);
        toast.error(error);
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setPageCount(0);
        setRotations({});
        setConversionId(null);
        setResultUrl(null);
        setIsProcessing(false);
    };

    const rotationOptions = [
        { value: 90, label: '90° Right' },
        { value: 180, label: '180°' },
        { value: 270, label: '90° Left' },
    ];

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
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <RotateCw className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Rotate Pages</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Rotate PDF pages to any angle. Fix upside-down or sideways scanned documents.
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

                            {/* Rotation Controls */}
                            {documentId && (
                                <div className="mt-8 space-y-6">
                                    {/* Global Rotation */}
                                    <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">Rotate All Pages</p>
                                            <p className="text-sm text-gray-500">Apply rotation to all pages at once</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={globalRotation}
                                                onChange={(e) => setGlobalRotation(Number(e.target.value))}
                                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            >
                                                {rotationOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={rotateAllPages}
                                                className="btn-secondary text-sm"
                                            >
                                                Apply to All
                                            </button>
                                        </div>
                                    </div>

                                    {/* Per-Page Rotation */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-4">
                                            Rotate Individual Pages
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                            {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
                                                <div
                                                    key={page}
                                                    className="p-3 border border-gray-200 rounded-xl text-center"
                                                >
                                                    <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                                                        <span className="text-2xl font-bold text-gray-400">{page}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-2">Page {page}</p>
                                                    <select
                                                        value={rotations[page] || 0}
                                                        onChange={(e) => setPageRotation(page, Number(e.target.value))}
                                                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                                                    >
                                                        <option value={0}>0°</option>
                                                        <option value={90}>90°</option>
                                                        <option value={180}>180°</option>
                                                        <option value={270}>270°</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Rotate Button */}
                            {documentId && (
                                <button
                                    onClick={handleRotate}
                                    disabled={isProcessing || Object.keys(rotations).length === 0}
                                    className="w-full mt-8 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <RotateCw className="w-5 h-5" />
                                            Rotate PDF
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
                                    <DownloadButton
                                        url={resultUrl}
                                        fallbackName={fileName ? `${fileName.replace(/\.[^.]+$/, '')}_rotated.pdf` : 'rotated.pdf'}
                                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Rotated PDF
                                    </DownloadButton>
                                    <button
                                        onClick={resetTool}
                                        className="btn-secondary"
                                    >
                                        Rotate Another
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
