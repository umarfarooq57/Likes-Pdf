'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, Droplets, Type, Image } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import toast from 'react-hot-toast';
import { documentsApi, securityApi } from '@/lib/api';

interface UploadedFile {
    id: string;
    filename: string;
    size: number;
}

const positions = [
    { value: 'center', label: 'Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' },
];

export default function WatermarkPage() {
    const [file, setFile] = useState<UploadedFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversionId, setConversionId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
    const [text, setText] = useState('CONFIDENTIAL');
    const [position, setPosition] = useState('center');
    const [fontSize, setFontSize] = useState(48);
    const [opacity, setOpacity] = useState(0.3);
    const [rotation, setRotation] = useState(45);
    const [color, setColor] = useState('#000000');

    const handleFilesSelected = async (selectedFiles: File[]) => {
        if (selectedFiles.length > 0) {
            try {
                const result = await documentsApi.upload(selectedFiles[0]);
                setFile({ id: result.id, filename: result.filename, size: result.size });
                toast.success('File uploaded successfully');
            } catch (error) {
                toast.error('Failed to upload file');
            }
        }
    };

    const handleAddWatermark = async () => {
        if (!file) {
            toast.error('Please upload a PDF file first');
            return;
        }

        if (watermarkType === 'text' && !text.trim()) {
            toast.error('Please enter watermark text');
            return;
        }

        setIsProcessing(true);

        try {
            const result = await securityApi.addTextWatermark(file.id, text, {
                position,
                fontSize,
                opacity,
                rotation,
                color,
            });
            setConversionId(result.id);
        } catch (error) {
            toast.error('Failed to add watermark');
            setIsProcessing(false);
        }
    };

    const handleComplete = (url: string) => {
        setResultUrl(url);
        setIsProcessing(false);
        toast.success('Watermark added successfully!');
    };

    const handleError = (error: string) => {
        setIsProcessing(false);
        toast.error(error);
    };

    const resetTool = () => {
        setFile(null);
        setConversionId(null);
        setResultUrl(null);
        setIsProcessing(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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
                {/* Back Link */}
                <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tools
                </Link>

                {/* Tool Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Droplets className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Add Watermark</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Add custom text or image watermarks to protect your PDF documents.
                        Customize position, opacity, and appearance.
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Upload & Preview */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document</h3>

                        {!file ? (
                            <FileDropzone
                                accept={{ 'application/pdf': ['.pdf'] }}
                                onFilesSelected={handleFilesSelected}
                                multiple={false}
                            />
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                                    <FileText className="w-8 h-8 text-green-600" />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{file.filename}</p>
                                        <p className="text-sm text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        Change
                                    </button>
                                </div>

                                {/* Preview */}
                                <div className="relative bg-gray-100 rounded-xl p-8 aspect-[3/4] flex items-center justify-center">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span
                                            style={{
                                                fontSize: `${fontSize / 2}px`,
                                                opacity: opacity,
                                                transform: `rotate(-${rotation}deg)`,
                                                color: color,
                                            }}
                                            className="font-bold whitespace-nowrap"
                                        >
                                            {text}
                                        </span>
                                    </div>
                                    <FileText className="w-24 h-24 text-gray-300" />
                                    <p className="absolute bottom-4 text-sm text-gray-400">Preview</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Settings */}
                    <div className="space-y-6">
                        {!conversionId ? (
                            <>
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Watermark Type</h3>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <button
                                            onClick={() => setWatermarkType('text')}
                                            className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${watermarkType === 'text'
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <Type className="w-6 h-6" />
                                            <span className="font-medium">Text</span>
                                        </button>
                                        <button
                                            onClick={() => setWatermarkType('image')}
                                            className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${watermarkType === 'image'
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <Image className="w-6 h-6" />
                                            <span className="font-medium">Image</span>
                                        </button>
                                    </div>

                                    {watermarkType === 'text' && (
                                        <div className="space-y-4">
                                            {/* Text Input */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Watermark Text
                                                </label>
                                                <input
                                                    type="text"
                                                    value={text}
                                                    onChange={(e) => setText(e.target.value)}
                                                    placeholder="Enter watermark text"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            </div>

                                            {/* Position */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Position
                                                </label>
                                                <select
                                                    value={position}
                                                    onChange={(e) => setPosition(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                >
                                                    {positions.map((pos) => (
                                                        <option key={pos.value} value={pos.value}>
                                                            {pos.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Font Size */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Font Size: {fontSize}px
                                                </label>
                                                <input
                                                    type="range"
                                                    min="12"
                                                    max="120"
                                                    value={fontSize}
                                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>

                                            {/* Opacity */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Opacity: {Math.round(opacity * 100)}%
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="1"
                                                    step="0.1"
                                                    value={opacity}
                                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>

                                            {/* Rotation */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Rotation: {rotation}°
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="90"
                                                    value={rotation}
                                                    onChange={(e) => setRotation(parseInt(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>

                                            {/* Color */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Color
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={color}
                                                        onChange={(e) => setColor(e.target.value)}
                                                        className="w-12 h-12 rounded-lg cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={color}
                                                        onChange={(e) => setColor(e.target.value)}
                                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {watermarkType === 'image' && (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                            <p className="text-yellow-700 text-sm">
                                                Image watermark coming soon. Please use text watermark for now.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Add Watermark Button */}
                                <button
                                    onClick={handleAddWatermark}
                                    disabled={!file || isProcessing || (watermarkType === 'text' && !text.trim())}
                                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Adding Watermark...
                                        </>
                                    ) : (
                                        <>
                                            <Droplets className="w-5 h-5" />
                                            Add Watermark
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="card">
                                <ProgressTracker
                                    conversionId={conversionId}
                                    onComplete={handleComplete}
                                    onError={handleError}
                                />

                                {resultUrl && (
                                    <div className="mt-6 space-y-3">
                                        <a
                                            href={resultUrl}
                                            download
                                            className="w-full btn-primary flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download PDF
                                        </a>
                                        <button
                                            onClick={resetTool}
                                            className="w-full btn-secondary"
                                        >
                                            Add Another Watermark
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
