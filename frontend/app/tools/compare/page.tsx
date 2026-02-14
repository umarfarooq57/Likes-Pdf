'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, GitCompare, Plus, Minus, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi } from '@/lib/api';

interface Difference {
    page: number;
    type: 'added' | 'removed' | 'modified';
    description: string;
}

export default function ComparePDFPage() {
    const [file1Id, setFile1Id] = useState<string | null>(null);
    const [file1Name, setFile1Name] = useState<string>('');
    const [file2Id, setFile2Id] = useState<string | null>(null);
    const [file2Name, setFile2Name] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [differences, setDifferences] = useState<Difference[] | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const handleFile1Selected = async (files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];
        try {
            const result = await documentsApi.upload(file);
            setFile1Id(result.id);
            setFile1Name(result.filename);
            toast.success('First file uploaded');
        } catch (error) {
            toast.error('Failed to upload file');
        }
    };

    const handleFile2Selected = async (files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];
        try {
            const result = await documentsApi.upload(file);
            setFile2Id(result.id);
            setFile2Name(result.filename);
            toast.success('Second file uploaded');
        } catch (error) {
            toast.error('Failed to upload file');
        }
    };

    const handleCompare = async () => {
        if (!file1Id || !file2Id) {
            toast.error('Please upload both PDF files');
            return;
        }

        setIsProcessing(true);

        try {
            // Simulated comparison result
            await new Promise(resolve => setTimeout(resolve, 2000));
            setDifferences([
                { page: 1, type: 'modified', description: 'Header text changed' },
                { page: 2, type: 'added', description: 'New paragraph added' },
                { page: 2, type: 'removed', description: 'Image removed' },
                { page: 3, type: 'modified', description: 'Table data updated' },
                { page: 5, type: 'added', description: 'New page inserted' },
            ]);
            setTotalPages(5);
            toast.success('Comparison complete!');
        } catch (error) {
            toast.error('Failed to compare PDFs');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTool = () => {
        setFile1Id(null);
        setFile1Name('');
        setFile2Id(null);
        setFile2Name('');
        setDifferences(null);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'added':
                return <Plus className="w-4 h-4 text-green-500" />;
            case 'removed':
                return <Minus className="w-4 h-4 text-red-500" />;
            default:
                return <GitCompare className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'added':
                return 'bg-green-50 border-green-200 text-green-700';
            case 'removed':
                return 'bg-red-50 border-red-200 text-red-700';
            default:
                return 'bg-yellow-50 border-yellow-200 text-yellow-700';
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">DocuForge</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 py-12">
                <Link href="/tools" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tools
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 mb-6">
                        <GitCompare className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Compare PDFs</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Compare two PDF documents and highlight the differences between them.
                    </p>
                </div>

                {!differences ? (
                    <div className="space-y-8">
                        {/* Upload Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* File 1 */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 text-center">Original Document</h3>
                                {!file1Id ? (
                                    <FileDropzone
                                        onFilesSelected={handleFile1Selected}
                                        maxFiles={1}
                                        acceptedTypes={['application/pdf']}
                                    />
                                ) : (
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{file1Name}</p>
                                                <p className="text-sm text-green-600">Original</p>
                                            </div>
                                            <button onClick={() => { setFile1Id(null); setFile1Name(''); }} className="text-gray-400 hover:text-gray-600">
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* File 2 */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 text-center">Modified Document</h3>
                                {!file2Id ? (
                                    <FileDropzone
                                        onFilesSelected={handleFile2Selected}
                                        maxFiles={1}
                                        acceptedTypes={['application/pdf']}
                                    />
                                ) : (
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{file2Name}</p>
                                                <p className="text-sm text-blue-600">Modified</p>
                                            </div>
                                            <button onClick={() => { setFile2Id(null); setFile2Name(''); }} className="text-gray-400 hover:text-gray-600">
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Compare Button */}
                        {file1Id && file2Id && (
                            <button
                                onClick={handleCompare}
                                disabled={isProcessing}
                                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Comparing Documents...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <GitCompare className="w-5 h-5" />
                                        Compare PDFs
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    /* Results */
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-4">Comparison Summary</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">
                                        {differences.filter(d => d.type === 'added').length}
                                    </p>
                                    <p className="text-sm text-green-700">Added</p>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">
                                        {differences.filter(d => d.type === 'removed').length}
                                    </p>
                                    <p className="text-sm text-red-700">Removed</p>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {differences.filter(d => d.type === 'modified').length}
                                    </p>
                                    <p className="text-sm text-yellow-700">Modified</p>
                                </div>
                            </div>
                        </div>

                        {/* Differences List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">All Differences ({differences.length})</h3>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                                {differences.map((diff, index) => (
                                    <div key={index} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                                        <span className="text-sm text-gray-500 w-16">Page {diff.page}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(diff.type)}`}>
                                            {diff.type}
                                        </span>
                                        <span className="text-gray-700">{diff.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Side by Side Preview */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Side by Side View</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 p-4">
                                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                                    <p className="text-gray-400">Original - Page {currentPage}</p>
                                </div>
                                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                                    <p className="text-gray-400">Modified - Page {currentPage}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={resetTool}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                Compare Other Files
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
