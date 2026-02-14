'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, ImageIcon, X, GripVertical } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import toast from 'react-hot-toast';
import { documentsApi, conversionsApi } from '@/lib/api';

interface UploadedImage {
    id: string;
    filename: string;
    size: number;
}

export default function ImagesToPDFPage() {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversionId, setConversionId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const handleFilesSelected = async (files: File[]) => {
        for (const file of files) {
            try {
                const result = await documentsApi.upload(file);
                setImages((prev) => [
                    ...prev,
                    { id: result.id, filename: result.filename, size: result.size },
                ]);
                toast.success(`${file.name} uploaded`);
            } catch (error) {
                toast.error(`Failed to upload ${file.name}`);
            }
        }
    };

    const removeImage = (id: string) => {
        setImages((prev) => prev.filter((img) => img.id !== id));
    };

    const moveImage = (fromIndex: number, toIndex: number) => {
        const newImages = [...images];
        const [removed] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, removed);
        setImages(newImages);
    };

    const handleConvert = async () => {
        if (images.length === 0) {
            toast.error('Please upload at least one image');
            return;
        }

        setIsProcessing(true);

        try {
            const imageIds = images.map((img) => img.id);
            const result = await conversionsApi.imagesToPdf(imageIds);
            setConversionId(result.id);
        } catch (error) {
            toast.error('Failed to start conversion');
            setIsProcessing(false);
        }
    };

    const handleComplete = (url: string) => {
        setResultUrl(url);
        setIsProcessing(false);
        toast.success('Conversion complete!');
    };

    const handleError = (error: string) => {
        setIsProcessing(false);
        toast.error(error);
    };

    const resetTool = () => {
        setImages([]);
        setConversionId(null);
        setResultUrl(null);
        setIsProcessing(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
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
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Images to PDF</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Convert multiple images into a single PDF document. Drag to reorder images before converting.
                    </p>
                </div>

                {/* Main Content */}
                <div className="card">
                    {!conversionId ? (
                        <>
                            {/* File Upload */}
                            <FileDropzone
                                accept={{
                                    'image/jpeg': ['.jpg', '.jpeg'],
                                    'image/png': ['.png'],
                                    'image/webp': ['.webp'],
                                    'image/gif': ['.gif'],
                                }}
                                onFilesSelected={handleFilesSelected}
                                multiple={true}
                            />

                            {/* Image List */}
                            {images.length > 0 && (
                                <div className="mt-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-medium text-gray-700">
                                            Images ({images.length})
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Drag to reorder
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        {images.map((image, index) => (
                                            <div
                                                key={image.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                                            >
                                                <div className="cursor-move text-gray-400 hover:text-gray-600">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium flex items-center justify-center">
                                                    {index + 1}
                                                </span>
                                                <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-gray-500" />
                                                </div>
                                                <span className="flex-1 text-gray-700 truncate">
                                                    {image.filename}
                                                </span>
                                                <span className="text-sm text-gray-400">
                                                    {(image.size / 1024 / 1024).toFixed(2)} MB
                                                </span>
                                                <div className="flex gap-1">
                                                    {index > 0 && (
                                                        <button
                                                            onClick={() => moveImage(index, index - 1)}
                                                            className="p-1 text-gray-400 hover:text-gray-600"
                                                            title="Move up"
                                                        >
                                                            ↑
                                                        </button>
                                                    )}
                                                    {index < images.length - 1 && (
                                                        <button
                                                            onClick={() => moveImage(index, index + 1)}
                                                            className="p-1 text-gray-400 hover:text-gray-600"
                                                            title="Move down"
                                                        >
                                                            ↓
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => removeImage(image.id)}
                                                        className="p-1 text-gray-400 hover:text-red-500"
                                                        title="Remove"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Convert Button */}
                            <button
                                onClick={handleConvert}
                                disabled={images.length === 0 || isProcessing}
                                className="w-full mt-8 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Converting...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5" />
                                        Create PDF from {images.length} Image{images.length !== 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Progress / Result */}
                            <ProgressTracker
                                conversionId={conversionId}
                                onComplete={handleComplete}
                                onError={handleError}
                            />

                            {resultUrl && (
                                <div className="mt-6 flex gap-4">
                                    <a
                                        href={resultUrl}
                                        download
                                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download PDF
                                    </a>
                                    <button
                                        onClick={resetTool}
                                        className="btn-secondary"
                                    >
                                        Convert More
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
