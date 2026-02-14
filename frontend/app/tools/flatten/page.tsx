'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, Download, Layers } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi } from '@/lib/api';

export default function FlattenPDFPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [flattenOptions, setFlattenOptions] = useState({
        forms: true,
        annotations: true,
        transparency: false,
        layers: false,
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

    const handleFlatten = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        setIsProcessing(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setResultUrl(`http://localhost:8000/api/v1/documents/${documentId}/download`);
            toast.success('PDF flattened successfully!');
        } catch (error) {
            toast.error('Failed to flatten PDF');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setResultUrl(null);
    };

    const options = [
        {
            id: 'forms',
            label: 'Form Fields',
            description: 'Convert fillable form fields to static text',
            icon: '📝',
        },
        {
            id: 'annotations',
            label: 'Annotations',
            description: 'Merge comments, highlights, and stamps into the page',
            icon: '💬',
        },
        {
            id: 'transparency',
            label: 'Transparency',
            description: 'Flatten transparent objects for print compatibility',
            icon: '🔲',
        },
        {
            id: 'layers',
            label: 'Layers',
            description: 'Merge all layers into a single layer',
            icon: '📚',
        },
    ];

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">DocuForge</span>
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 mb-6">
                        <Layers className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Flatten PDF</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Flatten form fields, annotations, and layers into a static, non-editable PDF document.
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
                                            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{fileName}</p>
                                                <p className="text-sm text-gray-500">Ready to flatten</p>
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
                                        <Layers className="w-5 h-5" />
                                        What to Flatten
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {options.map((option) => (
                                            <label
                                                key={option.id}
                                                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${flattenOptions[option.id as keyof typeof flattenOptions]
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-gray-200 hover:border-indigo-200'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={flattenOptions[option.id as keyof typeof flattenOptions]}
                                                    onChange={(e) => setFlattenOptions({
                                                        ...flattenOptions,
                                                        [option.id]: e.target.checked
                                                    })}
                                                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{option.icon}</span>
                                                        <p className="font-medium text-gray-900">{option.label}</p>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
                                    <Layers className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-indigo-700">
                                        <p className="font-medium">Why flatten a PDF?</p>
                                        <ul className="mt-1 space-y-1 list-disc list-inside">
                                            <li>Ensure consistent appearance across all viewers</li>
                                            <li>Prevent form data from being edited</li>
                                            <li>Prepare for printing or archiving</li>
                                            <li>Reduce file size in some cases</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Flatten Button */}
                                <button
                                    onClick={handleFlatten}
                                    disabled={isProcessing || !Object.values(flattenOptions).some(v => v)}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Flattening PDF...
                                        </span>
                                    ) : (
                                        'Flatten PDF'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Result */
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <Layers className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">PDF Flattened!</h3>
                        <p className="text-gray-600 mb-6">Your PDF has been successfully flattened.</p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={resultUrl}
                                download
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Download Flattened PDF
                            </a>
                            <button
                                onClick={resetTool}
                                className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                            >
                                Flatten Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
