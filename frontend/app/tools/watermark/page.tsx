'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Stamp, Loader2, CheckCircle2, Type, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import FileDropzone from '@/components/FileDropzone';
import DownloadButton from '@/components/DownloadButton';
import { documentsApi, securityApi, extractErrorMessage } from '@/lib/api';

export default function WatermarkPDFPage() {
    const [fileId, setFileId] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [position, setPosition] = useState<'center' | 'diagonal' | 'tiled'>('diagonal');
    const [fontSize, setFontSize] = useState<number>(48);
    const [opacity, setOpacity] = useState<number>(0.3);
    const [fontColor, setFontColor] = useState<string>('#808080');
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

    const handleWatermark = async () => {
        if (!fileId) {
            toast.error('Please upload a PDF first');
            return;
        }
        if (!watermarkText.trim()) {
            toast.error('Please enter watermark text');
            return;
        }

        setIsProcessing(true);
        setDownloadUrl(null);
        try {
            const result = await securityApi.addWatermarkText(fileId, {
                text: watermarkText.trim(),
                fontSize,
                opacity,
                fontColor,
                position,
                rotation: position === 'diagonal' ? 45 : 0,
            });
            const url = result.download_url || (result.result_document_id ? `/api/v1/documents/${result.result_document_id}/download` : null);
            if (!url) throw new Error('No download URL returned');
            setDownloadUrl(url);
            toast.success('Watermark added successfully!');
        } catch (error: any) {
            toast.error(extractErrorMessage(error));
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTool = () => {
        setFileId(null);
        setFileName('');
        setWatermarkText('CONFIDENTIAL');
        setDownloadUrl(null);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
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
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/20">
                        <Stamp className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Watermark PDF</h1>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Add text watermarks across PDF pages with customizable position, opacity, and rotation.
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
                                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 font-bold">
                                    PDF
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">{fileName}</p>
                                    <p className="text-xs text-gray-500">Ready for watermarking</p>
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Watermark Text
                                    </label>
                                    <div className="relative">
                                        <Type className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                        <input
                                            type="text"
                                            value={watermarkText}
                                            onChange={(e) => setWatermarkText(e.target.value)}
                                            placeholder="e.g. CONFIDENTIAL, DRAFT, INTERNAL USE"
                                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Position Style
                                        </label>
                                        <select
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value as any)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-sm bg-white"
                                        >
                                            <option value="diagonal">Diagonal 45° (Centered)</option>
                                            <option value="center">Horizontal Center</option>
                                            <option value="tiled">Tiled Across Page</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Font Color
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={fontColor}
                                                onChange={(e) => setFontColor(e.target.value)}
                                                className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
                                            />
                                            <span className="text-xs text-gray-500 uppercase">{fontColor}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                                            <span>Opacity</span>
                                            <span>{Math.round(opacity * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="0.9"
                                            step="0.05"
                                            value={opacity}
                                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                            className="w-full accent-sky-600"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                                            <span>Font Size</span>
                                            <span>{fontSize} pt</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="20"
                                            max="80"
                                            step="2"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                                            className="w-full accent-sky-600"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleWatermark}
                                    disabled={isProcessing || !watermarkText.trim()}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Applying Watermark...
                                        </>
                                    ) : (
                                        <>
                                            <Stamp className="w-5 h-5" />
                                            Apply Watermark
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-6 space-y-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Watermark Added!</h3>
                                <p className="text-sm text-gray-500">
                                    Your watermark has been embedded across the document pages.
                                </p>
                                <div className="max-w-xs mx-auto pt-2">
                                    <DownloadButton
                                        url={downloadUrl}
                                        fallbackName={`watermarked_${fileName}`}
                                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-base"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Watermarked PDF
                                    </DownloadButton>
                                </div>
                                <button
                                    onClick={resetTool}
                                    className="block mx-auto text-xs text-gray-500 hover:text-gray-800 pt-2"
                                >
                                    Watermark another document
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
