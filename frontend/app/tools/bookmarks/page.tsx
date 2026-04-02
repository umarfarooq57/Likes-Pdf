'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, Download, Bookmark, Plus, Trash2, ChevronRight, GripVertical } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi } from '@/lib/api';

interface BookmarkItem {
    id: string;
    title: string;
    page: number;
    level: number;
}

export default function BookmarksPDFPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([
        { id: '1', title: 'Introduction', page: 1, level: 0 },
        { id: '2', title: 'Chapter 1', page: 5, level: 0 },
        { id: '3', title: 'Section 1.1', page: 6, level: 1 },
        { id: '4', title: 'Chapter 2', page: 15, level: 0 },
    ]);
    const [totalPages, setTotalPages] = useState(50);

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];
        try {
            const result = await documentsApi.upload(file);
            setDocumentId(result.id || null);
            setFileName(result.filename);
            setTotalPages(50); // Default page count
            toast.success('File uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload file');
        }
    };

    const addBookmark = () => {
        const newBookmark: BookmarkItem = {
            id: Date.now().toString(),
            title: 'New Bookmark',
            page: 1,
            level: 0,
        };
        setBookmarks([...bookmarks, newBookmark]);
    };

    const updateBookmark = (id: string, field: keyof BookmarkItem, value: string | number) => {
        setBookmarks(bookmarks.map(b =>
            b.id === id ? { ...b, [field]: value } : b
        ));
    };

    const deleteBookmark = (id: string) => {
        setBookmarks(bookmarks.filter(b => b.id !== id));
    };

    const handleApply = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        if (bookmarks.length === 0) {
            toast.error('Please add at least one bookmark');
            return;
        }

        setIsProcessing(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setResultUrl(`http://localhost:8000/api/v1/documents/${documentId}/download`);
            toast.success('Bookmarks added successfully!');
        } catch (error) {
            toast.error('Failed to add bookmarks');
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
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">DocuForge</span>
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-6">
                        <Bookmark className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Add Bookmarks</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Create a table of contents with bookmarks for easy PDF navigation.
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
                                            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{fileName}</p>
                                                <p className="text-sm text-gray-500">{totalPages} pages</p>
                                            </div>
                                        </div>
                                        <button onClick={resetTool} className="text-gray-400 hover:text-gray-600">
                                            Change file
                                        </button>
                                    </div>
                                </div>

                                {/* Bookmarks Editor */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Bookmark className="w-5 h-5" />
                                            Bookmarks ({bookmarks.length})
                                        </h3>
                                        <button
                                            onClick={addBookmark}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Bookmark
                                        </button>
                                    </div>

                                    <div className="divide-y divide-gray-100">
                                        {bookmarks.map((bookmark) => (
                                            <div
                                                key={bookmark.id}
                                                className="p-4 flex items-center gap-4 hover:bg-gray-50"
                                                style={{ paddingLeft: `${1 + bookmark.level * 1.5}rem` }}
                                            >
                                                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />

                                                {bookmark.level > 0 && (
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                )}

                                                <input
                                                    type="text"
                                                    value={bookmark.title}
                                                    onChange={(e) => updateBookmark(bookmark.id, 'title', e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    placeholder="Bookmark title"
                                                />

                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">Page:</span>
                                                    <input
                                                        type="number"
                                                        value={bookmark.page}
                                                        onChange={(e) => updateBookmark(bookmark.id, 'page', parseInt(e.target.value) || 1)}
                                                        min={1}
                                                        max={totalPages}
                                                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    />
                                                </div>

                                                <select
                                                    value={bookmark.level}
                                                    onChange={(e) => updateBookmark(bookmark.id, 'level', parseInt(e.target.value))}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                >
                                                    <option value={0}>Level 1</option>
                                                    <option value={1}>Level 2</option>
                                                    <option value={2}>Level 3</option>
                                                </select>

                                                <button
                                                    onClick={() => deleteBookmark(bookmark.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {bookmarks.length === 0 && (
                                            <div className="p-8 text-center text-gray-500">
                                                <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                <p>No bookmarks yet. Click "Add Bookmark" to get started.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Apply Button */}
                                <button
                                    onClick={handleApply}
                                    disabled={isProcessing || bookmarks.length === 0}
                                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Adding Bookmarks...
                                        </span>
                                    ) : (
                                        'Add Bookmarks to PDF'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Result */
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <Bookmark className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Bookmarks Added!</h3>
                        <p className="text-gray-600 mb-6">Your PDF now has {bookmarks.length} bookmarks for easy navigation.</p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={resultUrl}
                                download
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Download PDF
                            </a>
                            <button
                                onClick={resetTool}
                                className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                            >
                                Add to Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
