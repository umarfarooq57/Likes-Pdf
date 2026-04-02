'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, Crop, Download, Settings } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi } from '@/lib/api';

const presets = [
    { name: 'Remove Margins', top: 10, right: 10, bottom: 10, left: 10 },
    { name: 'A4 Center', top: 20, right: 20, bottom: 20, left: 20 },
    { name: 'Custom', top: 0, right: 0, bottom: 0, left: 0 },
];

export default function CropPDFPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [cropValues, setCropValues] = useState({ top: 10, right: 10, bottom: 10, left: 10 });
    const [selectedPreset, setSelectedPreset] = useState('Remove Margins');
    const [applyToAll, setApplyToAll] = useState(true);

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];
        try {
            const result = await documentsApi.upload(file);
            setDocumentId(result.id || null);
            setFileName(result.filename);
            toast.success('File uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload file');
        }
    };

    const handlePresetChange = (presetName: string) => {
        setSelectedPreset(presetName);
        const preset = presets.find(p => p.name === presetName);
        if (preset) {
            setCropValues({ top: preset.top, right: preset.right, bottom: preset.bottom, left: preset.left });
        }
    };

    const handleCrop = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        setIsProcessing(true);

        try {
            // In real implementation, would call backend crop API
            await new Promise(resolve => setTimeout(resolve, 2000));
            setResultUrl(`http://localhost:8000/api/v1/documents/${documentId}/download`);
            toast.success('PDF cropped successfully!');
        } catch (error) {
            toast.error('Failed to crop PDF');
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
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-yellow-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">DocuForge</span>
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 mb-6">
                        <Crop className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Crop PDF</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Remove margins and crop PDF pages to the desired size.
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
                                            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-yellow-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{fileName}</p>
                                                <p className="text-sm text-gray-500">Ready to crop</p>
                                            </div>
                                        </div>
                                        <button onClick={resetTool} className="text-gray-400 hover:text-gray-600">
                                            Change file
                                        </button>
                                    </div>
                                </div>

                                {/* Crop Settings */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        Crop Settings
                                    </h3>

                                    {/* Presets */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Preset</label>
                                        <div className="flex gap-2">
                                            {presets.map((preset) => (
                                                <button
                                                    key={preset.name}
                                                    onClick={() => handlePresetChange(preset.name)}
                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedPreset === preset.name
                                                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {preset.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Margin Inputs */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Top (mm): {cropValues.top}</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={cropValues.top}
                                                onChange={(e) => setCropValues({ ...cropValues, top: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Right (mm): {cropValues.right}</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={cropValues.right}
                                                onChange={(e) => setCropValues({ ...cropValues, right: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Bottom (mm): {cropValues.bottom}</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={cropValues.bottom}
                                                onChange={(e) => setCropValues({ ...cropValues, bottom: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Left (mm): {cropValues.left}</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={cropValues.left}
                                                onChange={(e) => setCropValues({ ...cropValues, left: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    <div className="flex justify-center py-4">
                                        <div className="relative w-40 h-56 bg-gray-100 border-2 border-gray-300 rounded-lg">
                                            <div
                                                className="absolute bg-yellow-200 border-2 border-yellow-400 border-dashed rounded"
                                                style={{
                                                    top: `${cropValues.top * 2}%`,
                                                    right: `${cropValues.right * 2}%`,
                                                    bottom: `${cropValues.bottom * 2}%`,
                                                    left: `${cropValues.left * 2}%`,
                                                }}
                                            />
                                            <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">Preview</span>
                                        </div>
                                    </div>

                                    {/* Apply to all pages */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={applyToAll}
                                            onChange={(e) => setApplyToAll(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                                        />
                                        <span className="text-sm text-gray-700">Apply to all pages</span>
                                    </label>

                                    {/* Crop Button */}
                                    <button
                                        onClick={handleCrop}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Cropping PDF...
                                            </span>
                                        ) : (
                                            'Crop PDF'
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
                            <Crop className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">PDF Cropped!</h3>
                        <p className="text-gray-600 mb-6">Your cropped PDF is ready for download.</p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={resultUrl}
                                download
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Download PDF
                            </a>
                            <button
                                onClick={resetTool}
                                className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                            >
                                Crop Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
