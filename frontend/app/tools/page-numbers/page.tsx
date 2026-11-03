'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Hash, Loader2, CheckCircle2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import FileDropzone from '@/components/FileDropzone';
import DownloadButton from '@/components/DownloadButton';
import { documentsApi, securityApi, extractErrorMessage } from '@/lib/api';

export default function PageNumbersPage() {
    const [fileId, setFileId] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [position, setPosition] = useState<string>('bottom-center');
    const [formatString, setFormatString] = useState<string>('Page {page} of {total}');
    const [fontSize, setFontSize] = useState<number>(10);
    const [skipFirst, setSkipFirst] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];
        try {
            const uploaded = await documentsApi.upload(file);
            setFileId(uploaded.id || null);
            setFileName(uploaded.filename || file.name);
            setDownloadUrl(null);
            toast.success('PDF uploaded successfully');
        } catch (error: any) {
            toast.error(extractErrorMessage(error));
        }
    };

    const handleAddNumbers = async () => {
        if (!fileId) {
            toast.error('Please upload a PDF first');
            return;
        }

        setIsProcessing(true);
        setDownloadUrl(null);
        try {
            const result = await securityApi.addPageNumbers(fileId, {
                position,
                formatString,
                fontSize,
                skipFirst,
            });
            const url = result.download_url || (result.result_document_id ? `/api/v1/documents/${result.result_document_id}/download` : null);
            if (!url) throw new Error('No download URL returned');
            setDownloadUrl(url);
            toast.success('Page numbers added successfully!');
        } catch (error: any) {
            toast.error(extractErrorMessage(error));
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTool = () => {
        setFileId(null);
        setFileName('');
        setDownloadUrl(null);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
                <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to All Tools
                </Link>

                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                        <Hash className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Page Numbers</h1>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Insert clean page numbers into your PDF with custom positioning, numbering formats, and cover page exclusions.
                    </p>
                </div>

                {!fileId ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <FileDropzone
                            onFilesSelected={handleFilesSelected}
                            maxFiles={1}
                            acceptedTypes={['application/pdf']}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                                    PDF
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">{fileName}</p>
                                    <p className="text-xs text-gray-500">Ready for numbering</p>
                                </div>
                            </div>
                            <button
                                onClick={resetTool}
                                className="text-xs text-gray-500 hover:text-gray-800 underline"
                            >
                                Change file
                            </button>
                        </div>

                        {!downloadUrl ? (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Position
                                        </label>
                                        <select
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white"
                                        >
                                            <option value="bottom-center">Bottom Center</option>
                                            <option value="bottom-right">Bottom Right</option>
                                            <option value="bottom-left">Bottom Left</option>
                                            <option value="top-center">Top Center</option>
                                            <option value="top-right">Top Right</option>
                                            <option value="top-left">Top Left</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Format
                                        </label>
                                        <select
                                            value={formatString}
                                            onChange={(e) => setFormatString(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white"
                                        >
                                            <option value="Page {page} of {total}">Page &#123;page&#125; of &#123;total&#125;</option>
                                            <option value="{page} / {total}">&#123;page&#125; / &#123;total&#125;</option>
                                            <option value="Page {page}">Page &#123;page&#125;</option>
                                            <option value="{page}">Just Number (1, 2, ...)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                                            <span>Font Size</span>
                                            <span>{fontSize} pt</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="8"
                                            max="18"
                                            step="1"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                                            className="w-full accent-purple-600"
                                        />
                                    </div>

                                    <div className="flex items-center pt-5">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={skipFirst}
                                                onChange={(e) => setSkipFirst(e.target.checked)}
                                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300"
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                Skip first page (Cover page)
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddNumbers}
                                    disabled={isProcessing}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Numbering Pages...
                                        </>
                                    ) : (
                                        <>
                                            <Hash className="w-5 h-5" />
                                            Add Page Numbers
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-6 space-y-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Page Numbers Added!</h3>
                                <p className="text-sm text-gray-500">
                                    Your document has been numbered according to your selected format.
                                </p>
                                <div className="max-w-xs mx-auto pt-2">
                                    <DownloadButton
                                        url={downloadUrl}
                                        fallbackName={`numbered_${fileName}`}
                                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-base"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Numbered PDF
                                    </DownloadButton>
                                </div>
                                <button
                                    onClick={resetTool}
                                    className="block mx-auto text-xs text-gray-500 hover:text-gray-800 pt-2"
                                >
                                    Number another document
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
