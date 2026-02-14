'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, GripVertical, Download, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi, editingApi, securityApi } from '@/lib/api';

interface PageItem {
    pageNumber: number;
    thumbnail?: string;
}

export default function ReorderPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [pages, setPages] = useState<PageItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];
        setIsLoading(true);

        try {
            const result = await documentsApi.upload(file);
            setDocumentId(result.id);
            setFileName(result.filename);

            // Get thumbnails
            try {
                const thumbnails = await securityApi.getThumbnails(result.id, 'all', 150);
                const pageItems: PageItem[] = thumbnails.thumbnails.map((thumb: string, index: number) => ({
                    pageNumber: index + 1,
                    thumbnail: `data:image/png;base64,${thumb}`,
                }));
                setPages(pageItems);
            } catch {
                // Fallback: create page items without thumbnails
                const pageCount = result.page_count || 5;
                setPages(Array.from({ length: pageCount }, (_, i) => ({ pageNumber: i + 1 })));
            }

            toast.success('File uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload file');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const newPages = [...pages];
        const [draggedPage] = newPages.splice(draggedIndex, 1);
        newPages.splice(dropIndex, 0, draggedPage);
        setPages(newPages);
        setDraggedIndex(null);
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newPages = [...pages];
        [newPages[index], newPages[index - 1]] = [newPages[index - 1], newPages[index]];
        setPages(newPages);
    };

    const moveDown = (index: number) => {
        if (index === pages.length - 1) return;
        const newPages = [...pages];
        [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]];
        setPages(newPages);
    };

    const removePage = (index: number) => {
        setPages(pages.filter((_, i) => i !== index));
    };

    const handleReorder = async () => {
        if (!documentId || pages.length === 0) {
            toast.error('Please upload a PDF file first');
            return;
        }

        setIsProcessing(true);

        try {
            const newOrder = pages.map(p => p.pageNumber);
            const result = await editingApi.reorder(documentId, newOrder);
            setResultUrl(`http://localhost:8000/api/v1/convert/${result.id}/download`);
            toast.success('Pages reordered successfully!');
        } catch (error) {
            toast.error('Failed to reorder pages');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setPages([]);
        setResultUrl(null);
        setIsProcessing(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">DocuForge</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 py-12">
                <Link href="/tools" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tools
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 mb-6">
                        <GripVertical className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Reorder PDF Pages</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Drag and drop to rearrange pages in your PDF document.
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
                        ) : isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                <span className="ml-3 text-gray-600">Loading pages...</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* File Info */}
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                        <span className="font-medium text-gray-900">{fileName}</span>
                                        <span className="text-sm text-gray-500">({pages.length} pages)</span>
                                    </div>
                                    <button onClick={resetTool} className="text-gray-400 hover:text-gray-600 text-sm">
                                        Change file
                                    </button>
                                </div>

                                {/* Pages Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {pages.map((page, index) => (
                                        <div
                                            key={`${page.pageNumber}-${index}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, index)}
                                            className={`relative bg-white rounded-xl p-2 shadow-sm border-2 cursor-move transition-all ${draggedIndex === index ? 'border-indigo-500 opacity-50' : 'border-gray-100 hover:border-indigo-300'
                                                }`}
                                        >
                                            {/* Thumbnail */}
                                            <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                                {page.thumbnail ? (
                                                    <img src={page.thumbnail} alt={`Page ${page.pageNumber}`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-3xl font-bold text-gray-300">{page.pageNumber}</span>
                                                )}
                                            </div>

                                            {/* Page Number */}
                                            <div className="text-center text-sm font-medium text-gray-700">
                                                Page {page.pageNumber}
                                            </div>

                                            {/* Actions */}
                                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => moveUp(index)}
                                                    disabled={index === 0}
                                                    className="p-1 bg-white rounded shadow hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    <ArrowUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => moveDown(index)}
                                                    disabled={index === pages.length - 1}
                                                    className="p-1 bg-white rounded shadow hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    <ArrowDown className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => removePage(index)}
                                                    className="p-1 bg-white rounded shadow hover:bg-red-50 text-red-500"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Drag Handle */}
                                            <div className="absolute top-1 left-1 p-1 text-gray-400">
                                                <GripVertical className="w-4 h-4" />
                                            </div>

                                            {/* Position Badge */}
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full font-medium">
                                                {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Apply Button */}
                                <button
                                    onClick={handleReorder}
                                    disabled={isProcessing || pages.length === 0}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Reordering Pages...
                                        </span>
                                    ) : (
                                        'Apply New Order'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Result */
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <GripVertical className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Pages Reordered!</h3>
                        <p className="text-gray-600 mb-6">Your PDF with the new page order is ready.</p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={resultUrl}
                                download
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Download PDF
                            </a>
                            <button
                                onClick={resetTool}
                                className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                            >
                                Reorder Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
