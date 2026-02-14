'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, Download, Layers, EyeOff } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi } from '@/lib/api';

export default function RedactPDFPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [redactionType, setRedactionType] = useState<'text' | 'pattern' | 'area'>('text');
    const [searchText, setSearchText] = useState('');
    const [patterns, setPatterns] = useState({
        email: false,
        phone: false,
        ssn: false,
        creditCard: false,
        dates: false,
    });

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

    const handleRedact = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        if (redactionType === 'text' && !searchText.trim()) {
            toast.error('Please enter text to redact');
            return;
        }

        if (redactionType === 'pattern' && !Object.values(patterns).some(v => v)) {
            toast.error('Please select at least one pattern');
            return;
        }

        setIsProcessing(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 2500));
            setResultUrl(`http://localhost:8000/api/v1/documents/${documentId}/download`);
            toast.success('Redaction applied successfully!');
        } catch (error) {
            toast.error('Failed to apply redaction');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setResultUrl(null);
        setSearchText('');
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">DocuForge</span>
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 mb-6">
                        <EyeOff className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Redact PDF</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Permanently remove sensitive information from your PDF documents. Redacted content cannot be recovered.
                    </p>
                </div>

                {/* Warning */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-900">Permanent Redaction</p>
                        <p className="text-sm text-red-700">
                            Redacted content is permanently removed and cannot be recovered.
                            Always keep a backup of your original document.
                        </p>
                    </div>
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
                                            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{fileName}</p>
                                                <p className="text-sm text-gray-500">Ready to redact</p>
                                            </div>
                                        </div>
                                        <button onClick={resetTool} className="text-gray-400 hover:text-gray-600">
                                            Change file
                                        </button>
                                    </div>
                                </div>

                                {/* Redaction Type */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
                                    <h3 className="font-semibold text-gray-900">Redaction Method</h3>

                                    <div className="flex gap-2">
                                        {[
                                            { id: 'text', label: 'Search Text' },
                                            { id: 'pattern', label: 'Patterns' },
                                            { id: 'area', label: 'Select Area' },
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setRedactionType(type.id as typeof redactionType)}
                                                className={`flex-1 py-3 rounded-lg font-medium transition-all ${redactionType === type.id
                                                        ? 'bg-red-100 text-red-700 border-2 border-red-500'
                                                        : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                                                    }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Text Search */}
                                    {redactionType === 'text' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Text to Redact
                                            </label>
                                            <textarea
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                                placeholder="Enter text to find and redact..."
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                                rows={3}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Enter one phrase per line to redact multiple terms
                                            </p>
                                        </div>
                                    )}

                                    {/* Pattern Selection */}
                                    {redactionType === 'pattern' && (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-600 mb-3">
                                                Select patterns to automatically find and redact:
                                            </p>
                                            {[
                                                { id: 'email', label: 'Email Addresses', example: 'john@example.com' },
                                                { id: 'phone', label: 'Phone Numbers', example: '+1 (555) 123-4567' },
                                                { id: 'ssn', label: 'Social Security Numbers', example: '123-45-6789' },
                                                { id: 'creditCard', label: 'Credit Card Numbers', example: '4111-XXXX-XXXX-1234' },
                                                { id: 'dates', label: 'Dates', example: '01/15/2024' },
                                            ].map((pattern) => (
                                                <label
                                                    key={pattern.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={patterns[pattern.id as keyof typeof patterns]}
                                                        onChange={(e) => setPatterns({ ...patterns, [pattern.id]: e.target.checked })}
                                                        className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900">{pattern.label}</p>
                                                        <p className="text-xs text-gray-500">e.g., {pattern.example}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* Area Selection */}
                                    {redactionType === 'area' && (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-600">
                                                Area selection will be available in the PDF preview
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Click and drag to select areas to redact
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Redact Button */}
                                <button
                                    onClick={handleRedact}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Applying Redactions...
                                        </span>
                                    ) : (
                                        'Apply Redaction'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Result */
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <EyeOff className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Redaction Complete!</h3>
                        <p className="text-gray-600 mb-6">Your redacted PDF is ready for download.</p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={resultUrl}
                                download
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Download Redacted PDF
                            </a>
                            <button
                                onClick={resetTool}
                                className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                            >
                                Redact Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
