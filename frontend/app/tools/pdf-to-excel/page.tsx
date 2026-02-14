'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, FileSpreadsheet, Download, Table } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi, conversionsApi } from '@/lib/api';

export default function PDFToExcelPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [extractTables, setExtractTables] = useState(true);
    const [preserveFormatting, setPreserveFormatting] = useState(true);

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

    const handleConvert = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        setIsProcessing(true);

        try {
            // In real implementation, would call pdf-to-excel API
            await new Promise(resolve => setTimeout(resolve, 2500));
            setResultUrl(`http://localhost:8000/api/v1/convert/${documentId}/download`);
            toast.success('Converted to Excel successfully!');
        } catch (error) {
            toast.error('Failed to convert');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setResultUrl(null);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">DocuForge</span>
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 mb-6">
                        <FileSpreadsheet className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF to Excel</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Convert PDF tables and data into editable Excel spreadsheets with high accuracy.
                    </p>
                </div>

                {!resultUrl ? (
                    <div className="space-y-8">
                        {/* Upload Section */}
                        {!documentId ? (
                            <FileDropzone
                                onFilesSelected={handleFilesSelected}
                                maxFiles={1}
                                acceptedTypes={['application/pdf']}
                            />
                        ) : (
                            <div className="space-y-6">
                                {/* File Info */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{fileName}</p>
                                                <p className="text-sm text-gray-500">Ready to convert</p>
                                            </div>
                                        </div>
                                        <button onClick={resetTool} className="text-gray-400 hover:text-gray-600">
                                            Change file
                                        </button>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Table className="w-5 h-5" />
                                        Conversion Options
                                    </h3>

                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={extractTables}
                                            onChange={(e) => setExtractTables(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Extract Tables Only</p>
                                            <p className="text-sm text-gray-500">Only extract tabular data, ignore other content</p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={preserveFormatting}
                                            onChange={(e) => setPreserveFormatting(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Preserve Formatting</p>
                                            <p className="text-sm text-gray-500">Keep cell colors, borders, and text formatting</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Convert Button */}
                                <button
                                    onClick={handleConvert}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Converting to Excel...
                                        </span>
                                    ) : (
                                        'Convert to Excel'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Result */
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <FileSpreadsheet className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Conversion Complete!</h3>
                        <p className="text-gray-600 mb-6">Your Excel file is ready for download.</p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={resultUrl}
                                download={fileName.replace('.pdf', '.xlsx')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Download Excel
                            </a>
                            <button
                                onClick={resetTool}
                                className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                            >
                                Convert Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
