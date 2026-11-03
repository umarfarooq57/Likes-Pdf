'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, Crop, Download } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import DownloadButton from '@/components/DownloadButton';
import toast from 'react-hot-toast';
import { documentsApi, editingApi, extractErrorMessage } from '@/lib/api';

const PRESETS = [
    { name: 'Remove Margins',  left: 5,  top: 5,  right: 5,  bottom: 5  },
    { name: 'Center Crop',     left: 10, top: 10, right: 10, bottom: 10 },
    { name: 'Wide Crop',       left: 5,  top: 15, right: 5,  bottom: 15 },
    { name: 'Custom',          left: 0,  top: 0,  right: 0,  bottom: 0  },
];

export default function CropPDFPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [selectedPreset, setSelectedPreset] = useState('Remove Margins');
    const [margins, setMargins] = useState({ left: 5, top: 5, right: 5, bottom: 5 });
    const [applyToAll, setApplyToAll] = useState(true);

    const handleFilesSelected = async (files: File[]) => {
        if (!files.length) return;
        const file = files[0];
        setIsUploading(true);
        try {
            const result = await documentsApi.upload(file);
            setDocumentId(result.id || null);
            setFileName(result.filename || file.name);
            setResultUrl(null);
            toast.success('File uploaded successfully');
        } catch (err: any) {
            toast.error(extractErrorMessage(err));
        } finally {
            setIsUploading(false);
        }
    };

    const applyPreset = (presetName: string) => {
        setSelectedPreset(presetName);
        const preset = PRESETS.find((p) => p.name === presetName);
        if (preset) setMargins({ left: preset.left, top: preset.top, right: preset.right, bottom: preset.bottom });
    };

    const updateMargin = (side: keyof typeof margins, value: number) => {
        setSelectedPreset('Custom');
        setMargins((m) => ({ ...m, [side]: Math.max(0, Math.min(49, value)) }));
    };

    const handleCrop = async () => {
        if (!documentId) { toast.error('Please upload a PDF file first'); return; }
        setIsProcessing(true);
        try {
            const result = await editingApi.crop(documentId, margins, applyToAll ? undefined : []);
            const url = result.download_url || result.result_url || `/api/v1/convert/${result.id}/download`;
            setResultUrl(url);
            toast.success('PDF cropped successfully!');
        } catch (err: any) {
            toast.error(extractErrorMessage(err));
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
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-yellow-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">DocuForge</span>
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
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 mb-6">
                        <Crop className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">Crop PDF</h1>
                    <p className="text-lg text-gray-600">Remove margins and unwanted areas from every page</p>
                </div>

                <div className="card">
                    {/* Upload */}
                    {!documentId ? (
                        <FileDropzone
                            onFilesSelected={handleFilesSelected}
                            accept={{ 'application/pdf': ['.pdf'] }}
                            maxFiles={1}
                        />
                    ) : (
                        <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <Crop className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{fileName}</p>
                                <p className="text-sm text-gray-500">Ready to crop</p>
                            </div>
                            <button onClick={resetTool} className="text-sm text-gray-500 hover:text-gray-700">
                                Change file
                            </button>
                        </div>
                    )}

                    {documentId && !resultUrl && (
                        <>
                            {/* Presets */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Preset</label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESETS.map((p) => (
                                        <button
                                            key={p.name}
                                            onClick={() => applyPreset(p.name)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                                selectedPreset === p.name
                                                    ? 'bg-yellow-500 border-yellow-500 text-white'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-yellow-400'
                                            }`}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Margin sliders */}
                            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                                    <div key={side}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                            {side}: {margins[side]}%
                                        </label>
                                        <input
                                            type="range"
                                            min={0}
                                            max={49}
                                            value={margins[side]}
                                            onChange={(e) => updateMargin(side, Number(e.target.value))}
                                            className="w-full accent-yellow-500"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Apply to all pages toggle */}
                            <div className="mb-6 flex items-center gap-3">
                                <input
                                    id="apply-all"
                                    type="checkbox"
                                    checked={applyToAll}
                                    onChange={(e) => setApplyToAll(e.target.checked)}
                                    className="w-4 h-4 accent-yellow-500 rounded"
                                />
                                <label htmlFor="apply-all" className="text-sm text-gray-700">
                                    Apply to all pages
                                </label>
                            </div>

                            <button
                                onClick={handleCrop}
                                disabled={isProcessing}
                                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Cropping…
                                    </>
                                ) : (
                                    <>
                                        <Crop className="w-5 h-5" />
                                        Crop PDF
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {resultUrl && (
                        <div className="mt-6 flex gap-4">
                            <DownloadButton
                                url={resultUrl}
                                fallbackName={fileName ? fileName.replace(/\.[^.]+$/, '') + '_cropped.pdf' : 'cropped.pdf'}
                                className="flex-1 btn-primary flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Download Cropped PDF
                            </DownloadButton>
                            <button onClick={resetTool} className="btn-secondary">
                                Crop Another
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
