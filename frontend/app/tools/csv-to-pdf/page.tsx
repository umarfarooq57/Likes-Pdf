'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, FileSpreadsheet } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import DownloadButton from '@/components/DownloadButton';
import toast from 'react-hot-toast';
import { documentsApi, conversionsApi } from '@/lib/api';

export default function CSVToPDFPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
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
            toast.error('Please upload a CSV file first');
            return;
        }
        setIsProcessing(true);
        try {
            const result = await conversionsApi.csvToPdf(documentId);
            setConversionId(result.id);
        } catch (error) {
            toast.error('Failed to start conversion');
            setIsProcessing(false);
        }
    };

    const handleComplete = (url: string) => {
        setResultUrl(url);
        setIsProcessing(false);
        toast.success('Report generated successfully!');
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

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
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
                <Link href="/tools" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tools
                </Link>

                <div className="text-center mb-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                        <FileSpreadsheet className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">CSV to PDF</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Generate a professional PDF report from your CSV data. Perfect for data visualization and distribution.
                    </p>
                </div>

                <div className="card">
                    {!conversionId ? (
                        <>
                            {!documentId ? (
                                <FileDropzone
                                    accept={{ 'text/csv': ['.csv'] }}
                                    onFilesSelected={handleFilesSelected}
                                    multiple={false}
                                />
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                                        <FileSpreadsheet className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{fileName}</p>
                                        <p className="text-sm text-gray-500">Ready to generate PDF</p>
                                    </div>
                                    <button onClick={resetTool} className="text-sm text-gray-500 hover:text-gray-700">
                                        Change file
                                    </button>
                                </div>
                            )}

                            {documentId && (
                                <button
                                    onClick={handleConvert}
                                    disabled={isProcessing}
                                    className="w-full mt-8 btn-primary flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating Report...
                                        </>
                                    ) : (
                                        <>
                                            <FileSpreadsheet className="w-5 h-5" />
                                            Generate PDF
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <ProgressTracker
                                conversionId={conversionId}
                                onComplete={handleComplete}
                                onError={handleError}
                            />

                            {resultUrl && (
                                <div className="mt-6 flex gap-4">
                                    <DownloadButton url={resultUrl} fallbackName="result.pdf" className="flex-1 btn-primary flex items-center justify-center gap-2">
                                        <Download className="w-5 h-5" />
                                        Download PDF
                                    </DownloadButton>
                                    <button onClick={resetTool} className="btn-secondary">
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
