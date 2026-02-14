'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, Hash, Settings } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import toast from 'react-hot-toast';
import { documentsApi, securityApi } from '@/lib/api';

const positions = [
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
];

const formats = [
    { value: 'Page {n} of {total}', label: 'Page 1 of 10' },
    { value: '{n}', label: '1' },
    { value: '{n}/{total}', label: '1/10' },
    { value: '- {n} -', label: '- 1 -' },
    { value: '[{n}]', label: '[1]' },
];

export default function PageNumbersPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [position, setPosition] = useState('bottom-center');
    const [format, setFormat] = useState('Page {n} of {total}');
    const [fontSize, setFontSize] = useState(10);
    const [startNumber, setStartNumber] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
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

    const handleAddPageNumbers = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        setIsProcessing(true);

        try {
            const result = await securityApi.addPageNumbers(documentId, {
                position,
                format,
                fontSize,
                startNumber,
            });
            setResultUrl(`http://localhost:8000/api/v1/convert/${result.id}/download`);
            toast.success('Page numbers added successfully!');
        } catch (error) {
            toast.error('Failed to add page numbers');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setResultUrl(null);
        setIsProcessing(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">DocuForge</span>
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
                        <Hash className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Add Page Numbers</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Add customizable page numbers to your PDF documents with various positions and formats.
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
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{fileName}</p>
                                            <p className="text-sm text-gray-500">Ready to add page numbers</p>
                                        </div>
                                    </div>
                                    <button onClick={resetTool} className="text-gray-400 hover:text-gray-600">
                                        Change file
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Options */}
                        {documentId && (
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Page Number Options
                                </h3>

                                {/* Position */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {positions.map((pos) => (
                                            <button
                                                key={pos.value}
                                                onClick={() => setPosition(pos.value)}
                                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${position === pos.value
                                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {pos.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Format */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {formats.map((fmt) => (
                                            <button
                                                key={fmt.value}
                                                onClick={() => setFormat(fmt.value)}
                                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${format === fmt.value
                                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {fmt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Font Size */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Font Size: {fontSize}pt
                                    </label>
                                    <input
                                        type="range"
                                        min="8"
                                        max="24"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                {/* Start Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Number</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={startNumber}
                                        onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Process Button */}
                                <button
                                    onClick={handleAddPageNumbers}
                                    disabled={isProcessing}
                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Adding Page Numbers...
                                        </span>
                                    ) : (
                                        'Add Page Numbers'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Result */
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <Hash className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Page Numbers Added!</h3>
                        <p className="text-gray-600 mb-6">Your PDF is ready for download.</p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={resultUrl}
                                download
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Download PDF
                            </a>
                            <button
                                onClick={resetTool}
                                className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                            >
                                Process Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
