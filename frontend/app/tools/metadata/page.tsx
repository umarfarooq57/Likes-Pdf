'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, Info, Save } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi, securityApi } from '@/lib/api';

export default function MetadataPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const [metadata, setMetadata] = useState({
        title: '',
        author: '',
        subject: '',
        keywords: '',
        creator: '',
    });

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];
        setIsLoading(true);

        try {
            const result = await documentsApi.upload(file);
            setDocumentId(result.id);
            setFileName(result.filename);

            // Fetch existing metadata
            try {
                const existingMetadata = await securityApi.getMetadata(result.id);
                setMetadata({
                    title: existingMetadata.title || '',
                    author: existingMetadata.author || '',
                    subject: existingMetadata.subject || '',
                    keywords: existingMetadata.keywords || '',
                    creator: existingMetadata.creator || '',
                });
            } catch {
                // No existing metadata
            }

            toast.success('File uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload file');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveMetadata = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        setIsSaving(true);

        try {
            const result = await securityApi.setMetadata(documentId, metadata);
            setResultUrl(`http://localhost:8000/api/v1/convert/${result.id}/download`);
            toast.success('Metadata saved successfully!');
        } catch (error) {
            toast.error('Failed to save metadata');
        } finally {
            setIsSaving(false);
        }
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setResultUrl(null);
        setMetadata({ title: '', author: '', subject: '', keywords: '', creator: '' });
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">DocuForge</span>
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 mb-6">
                        <Info className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Edit PDF Metadata</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        View and edit document properties like title, author, subject, and keywords.
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
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{fileName}</p>
                                                <p className="text-sm text-gray-500">Edit metadata below</p>
                                            </div>
                                        </div>
                                        <button onClick={resetTool} className="text-gray-400 hover:text-gray-600">
                                            Change file
                                        </button>
                                    </div>
                                </div>

                                {/* Metadata Form */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Info className="w-5 h-5" />
                                        Document Properties
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                            <input
                                                type="text"
                                                value={metadata.title}
                                                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                                placeholder="Document title"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                                            <input
                                                type="text"
                                                value={metadata.author}
                                                onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                                                placeholder="Author name"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                            <input
                                                type="text"
                                                value={metadata.subject}
                                                onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                                                placeholder="Document subject"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                                            <input
                                                type="text"
                                                value={metadata.keywords}
                                                onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                                                placeholder="keyword1, keyword2, keyword3"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Creator Application</label>
                                            <input
                                                type="text"
                                                value={metadata.creator}
                                                onChange={(e) => setMetadata({ ...metadata, creator: e.target.value })}
                                                placeholder="Application name"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={handleSaveMetadata}
                                        disabled={isSaving}
                                        className="w-full py-3 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Saving Metadata...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Save className="w-5 h-5" />
                                                Save Metadata
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Result */
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <Info className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Metadata Saved!</h3>
                        <p className="text-gray-600 mb-6">Your PDF with updated metadata is ready.</p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={resultUrl}
                                download
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Download PDF
                            </a>
                            <button
                                onClick={resetTool}
                                className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                            >
                                Edit Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
