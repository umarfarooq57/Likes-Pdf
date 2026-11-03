'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    FileText,
    ArrowLeft,
    Download,
    Loader2,
    ImageIcon,
    X,
    GripVertical,
    RotateCw,
    Trash2,
    Plus,
    ArrowUpDown,
    Check,
    CheckCircle2,
    Maximize2,
    FileDown,
    Sparkles,
    Layers,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    SlidersHorizontal,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import { documentsApi, conversionsApi, extractErrorMessage } from '@/lib/api';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface StudioImage {
    id: string;
    documentId?: string;
    file: File;
    previewUrl: string;
    filename: string;
    size: number;
    rotation: number; // 0, 90, 180, 270
    status: 'uploading' | 'ready' | 'error';
}

type Orientation = 'portrait' | 'landscape';
type PageSize = 'A4' | 'Letter' | 'fit';
type MarginSize = 'none' | 'small' | 'big';

export default function ImagesToPDFPage() {
    const [images, setImages] = useState<StudioImage[]>([]);
    const [orientation, setOrientation] = useState<Orientation>('portrait');
    const [pageSize, setPageSize] = useState<PageSize>('A4');
    const [margin, setMargin] = useState<MarginSize>('small');
    const [mergeAll, setMergeAll] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [resultFilename, setResultFilename] = useState<string>('converted_images.pdf');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadTaskRef = useRef<Promise<any> | null>(null);
    const imagesRef = useRef<StudioImage[]>([]);

    useEffect(() => {
        imagesRef.current = images;
    }, [images]);

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            images.forEach((img) => {
                if (img.previewUrl && img.previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(img.previewUrl);
                }
            });
        };
    }, []);

    // Handle files added (from initial dropzone or floating '+' button)
    const handleAddFiles = async (files: FileList | File[]) => {
        const fileArr = Array.from(files).filter((file) =>
            file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|tiff)$/i.test(file.name)
        );

        if (fileArr.length === 0) {
            toast.error('Please select valid image files (JPG, PNG, WEBP, GIF)');
            return;
        }

        const newStudioImages: StudioImage[] = fileArr.map((file) => ({
            id: Math.random().toString(36).substring(2, 9),
            file,
            previewUrl: URL.createObjectURL(file),
            filename: file.name,
            size: file.size,
            rotation: 0,
            status: 'uploading',
        }));

        setImages((prev) => [...prev, ...newStudioImages]);

        // ULTRA-FAST PARALLEL UPLOAD: Upload all files concurrently
        const uploadTask = Promise.all(
            newStudioImages.map(async (item) => {
                try {
                    const uploaded = await documentsApi.upload(item.file);
                    const docId = uploaded.id || (uploaded as any).file_id;
                    item.documentId = docId;
                    item.status = 'ready';
                    setImages((prev) =>
                        prev.map((img): StudioImage =>
                            img.id === item.id
                                ? { ...img, documentId: docId, status: 'ready' as const }
                                : img
                        )
                    );
                    return docId;
                } catch (err) {
                    item.status = 'error';
                    setImages((prev) =>
                        prev.map((img): StudioImage =>
                            img.id === item.id ? { ...img, status: 'error' as const } : img
                        )
                    );
                    toast.error(`Failed to upload ${item.filename}: ${extractErrorMessage(err)}`);
                    return null;
                }
            })
        );

        uploadTaskRef.current = uploadTask;
    };

    // Card Actions
    const rotateImage = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setImages((prev) =>
            prev.map((img) =>
                img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
            )
        );
    };

    const rotateAll = () => {
        setImages((prev) =>
            prev.map((img) => ({ ...img, rotation: (img.rotation + 90) % 360 }))
        );
        toast.success('Rotated all images 90°');
    };

    const removeImage = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setImages((prev) => {
            const target = prev.find((img) => img.id === id);
            if (target?.previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(target.previewUrl);
            }
            return prev.filter((img) => img.id !== id);
        });
    };

    const moveImage = (from: number, to: number) => {
        if (from < 0 || to < 0 || from >= images.length || to >= images.length) return;
        setImages((prev) => {
            const copy = [...prev];
            const [item] = copy.splice(from, 1);
            copy.splice(to, 0, item);
            return copy;
        });
    };

    const sortImages = (ascending: boolean) => {
        setImages((prev) => {
            const sorted = [...prev].sort((a, b) =>
                ascending
                    ? a.filename.localeCompare(b.filename)
                    : b.filename.localeCompare(a.filename)
            );
            return sorted;
        });
        toast.success(ascending ? 'Sorted A to Z' : 'Sorted Z to A');
    };

    const clearAll = () => {
        images.forEach((img) => {
            if (img.previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(img.previewUrl);
            }
        });
        setImages([]);
        setResultUrl(null);
    };

    // Drag and Drop handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (targetIndex: number) => {
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            moveImage(draggedIndex, targetIndex);
        }
        setDraggedIndex(null);
    };

    // Convert Action
    const handleConvert = async () => {
        let currentList = imagesRef.current.length > 0 ? imagesRef.current : images;
        if (currentList.length === 0) {
            toast.error('Please upload at least one image');
            return;
        }

        setIsProcessing(true);
        setProcessProgress(5);

        // Slow, realistic progress: caps at 85% until backend responds
        const progressInterval = setInterval(() => {
            setProcessProgress((prev) => Math.min(prev + Math.floor(Math.random() * 3) + 1, 85));
        }, 1500);

        try {
            // Await background parallel uploads if any are still finishing
            if (uploadTaskRef.current) {
                await uploadTaskRef.current;
            }

            currentList = imagesRef.current.length > 0 ? imagesRef.current : images;
            const validDocIds = currentList
                .map((img) => img.documentId)
                .filter((id): id is string => Boolean(id));

            if (validDocIds.length === 0) {
                throw new Error('Images are still uploading. Please wait a moment and try again.');
            }

            const rotations: Record<string, number> = {};
            currentList.forEach((img) => {
                if (img.documentId && img.rotation) {
                    rotations[img.documentId] = img.rotation;
                }
            });

            setProcessProgress(80);

            const response = await conversionsApi.imagesToPdf(validDocIds, {
                orientation,
                pageSize,
                margin,
                rotations,
            });

            clearInterval(progressInterval);
            setProcessProgress(100);

            const downloadUrl =
                response.download_url ||
                response.result_url ||
                `/api/v1/convert/${response.id}/download`;

            setResultUrl(downloadUrl);
            setResultFilename(
                response.result_filename ||
                response.original_name ||
                `${(currentList[0])?.filename?.replace(/\.[^/.]+$/, '') || 'document'}_converted.pdf`
            );
            toast.success('PDF converted in seconds!');
        } catch (error: any) {
            clearInterval(progressInterval);
            toast.error(extractErrorMessage(error));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!resultUrl) return;
        try {
            const link = document.createElement('a');
            link.href = resultUrl;
            link.download = resultFilename || 'converted_images.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Download started');
        } catch (err) {
            window.open(resultUrl, '_blank');
        }
    };

    const totalSizeMb = (
        images.reduce((acc, curr) => acc + curr.size, 0) /
        (1024 * 1024)
    ).toFixed(2);

    return (
        <div className="min-h-screen bg-[#f3f4f7] flex flex-col font-sans">
            <Navbar />

            {/* Hidden File Input for Floating '+' button */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files) {
                        handleAddFiles(e.target.files);
                    }
                    e.target.value = '';
                }}
            />

            {/* Main Workbench Body */}
            <main className="flex-1 pt-16 flex flex-col">
                {/* STATE 1: INITIAL EMPTY / UPLOAD VIEW */}
                {images.length === 0 && !resultUrl && (
                    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 max-w-4xl mx-auto w-full">
                        {/* Tool Branding */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-xl shadow-red-500/20 mb-5 transform hover:scale-105 transition-transform duration-300">
                                <ImageIcon className="w-10 h-10" />
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
                                Images to PDF
                            </h1>
                            <p className="text-lg text-gray-600 max-w-xl mx-auto">
                                Convert JPG, PNG, BMP, GIF, and WEBP images to high-definition PDF documents. Customize page orientation, margins, and sizes in real-time.
                            </p>
                        </div>

                        {/* Big Interactive Dropzone */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files) {
                                    handleAddFiles(e.dataTransfer.files);
                                }
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-red-500 rounded-3xl p-10 sm:p-16 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 group"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-red-50 group-hover:bg-red-100 text-red-600 flex items-center justify-center mb-6 transition-colors">
                                <FileDown className="w-10 h-10 transform group-hover:-translate-y-1 transition-transform duration-200" />
                            </div>

                            <button
                                type="button"
                                className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-lg shadow-lg shadow-red-600/30 transition-all flex items-center gap-3 mb-4"
                            >
                                <Plus className="w-6 h-6" /> Select Image Files
                            </button>

                            <p className="text-gray-500 font-medium text-sm sm:text-base">
                                or drop images here
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                                {['JPG', 'PNG', 'WEBP', 'GIF', 'BMP', 'TIFF'].map((fmt) => (
                                    <span
                                        key={fmt}
                                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold uppercase tracking-wider"
                                    >
                                        {fmt}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Value Prosp Features */}
                        <div className="grid sm:grid-cols-3 gap-6 mt-12 w-full">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <Sparkles className="w-6 h-6 text-red-500 mx-auto mb-2" />
                                <h3 className="font-bold text-gray-900 mb-1">Ultra HD Quality</h3>
                                <p className="text-xs text-gray-500">Lossless conversion with full image resolution preserved.</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <Layers className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                                <h3 className="font-bold text-gray-900 mb-1">Custom Studio</h3>
                                <p className="text-xs text-gray-500">Adjust orientation, margins, and page sizes visually.</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                                <h3 className="font-bold text-gray-900 mb-1">100% Free & Secure</h3>
                                <p className="text-xs text-gray-500">Files are encrypted and shredded automatically after 24 hours.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* STATE 2: STUDIO WORKBENCH (iLovePDF Style Split Canvas + Sticky Options) */}
                {images.length > 0 && !resultUrl && (
                    <div className="flex-1 flex flex-col lg:flex-row h-full">
                        {/* LEFT: STUDIO CANVAS (70-75%) */}
                        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-[500px]">
                            {/* Canvas Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
                                        {images.length}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                                            {images.length} {images.length === 1 ? 'Image' : 'Images'} Selected
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Total size: {totalSizeMb} MB • Drag cards to reorder
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Sort button */}
                                    <button
                                        type="button"
                                        onClick={() => sortImages(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="Sort alphabetically"
                                    >
                                        <ArrowUpDown className="w-3.5 h-3.5" /> Sort A-Z
                                    </button>

                                    {/* Rotate All */}
                                    <button
                                        type="button"
                                        onClick={rotateAll}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="Rotate all images 90° clockwise"
                                    >
                                        <RotateCw className="w-3.5 h-3.5" /> Rotate All
                                    </button>

                                    {/* Clear All */}
                                    <button
                                        type="button"
                                        onClick={clearAll}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Remove all files"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Clear
                                    </button>

                                    {/* Add More Files (Floating circular button like iLovePDF) */}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
                                        title="Add more images"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                            {images.length}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Thumbnail Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                                {images.map((img, index) => (
                                    <div
                                        key={img.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(index)}
                                        className={clsx(
                                            'group relative bg-white rounded-2xl border-2 transition-all duration-200 flex flex-col shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing overflow-hidden',
                                            orientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]',
                                            draggedIndex === index
                                                ? 'opacity-40 border-dashed border-red-500 scale-95'
                                                : 'border-gray-200 hover:border-red-400'
                                        )}
                                    >
                                        {/* Top Card Bar: Page Badge & Hover Actions */}
                                        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
                                            <span className="px-2 py-0.5 rounded-md bg-gray-900/80 backdrop-blur-sm text-white text-[11px] font-bold shadow">
                                                {index + 1}
                                            </span>

                                            <div className="flex items-center gap-1 pointer-events-auto opacity-90 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => rotateImage(img.id, e)}
                                                    className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-gray-700 hover:text-red-600 shadow flex items-center justify-center transition-all hover:scale-105"
                                                    title="Rotate 90° clockwise"
                                                >
                                                    <RotateCw className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => removeImage(img.id, e)}
                                                    className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-gray-700 hover:text-red-600 shadow flex items-center justify-center transition-all hover:scale-105"
                                                    title="Remove image"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Image Preview Canvas */}
                                        <div className="flex-1 w-full p-3 flex items-center justify-center overflow-hidden bg-slate-50">
                                            <img
                                                src={img.previewUrl}
                                                alt={img.filename}
                                                style={{
                                                    transform: `rotate(${img.rotation}deg)`,
                                                }}
                                                className="max-h-full max-w-full object-contain rounded shadow-sm transition-transform duration-300"
                                            />
                                        </div>

                                        {/* Card Footer: Filename and Reorder Controls */}
                                        <div className="p-2.5 bg-white border-t border-gray-100 flex items-center justify-between gap-1">
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className="text-xs font-medium text-gray-800 truncate"
                                                    title={img.filename}
                                                >
                                                    {img.filename}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {(img.size / 1024).toFixed(0)} KB
                                                </p>
                                            </div>

                                            {/* Micro-arrow reorder */}
                                            <div className="flex items-center -space-x-1">
                                                <button
                                                    type="button"
                                                    disabled={index === 0}
                                                    onClick={() => moveImage(index, index - 1)}
                                                    className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-20"
                                                    title="Move left"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === images.length - 1}
                                                    onClick={() => moveImage(index, index + 1)}
                                                    className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-20"
                                                    title="Move right"
                                                >
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add more files card placeholder */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={clsx(
                                        'rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-400 bg-white/60 hover:bg-white flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-200 group text-center',
                                        orientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]'
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center mb-2 transition-all">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 group-hover:text-red-600">
                                        Add more images
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: STUDIO SIDEBAR OPTIONS (28-30%) */}
                        <div className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-6 flex flex-col justify-between shadow-xl z-20">
                            <div className="space-y-6">
                                {/* Sidebar Title */}
                                <div className="border-b border-gray-100 pb-4">
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <SlidersHorizontal className="w-5 h-5 text-red-600" />
                                        Image to PDF options
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Configure document layout & page geometry
                                    </p>
                                </div>

                                {/* 1. Page Orientation */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                                        Page Orientation
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setOrientation('portrait')}
                                            className={clsx(
                                                'p-3.5 rounded-xl border-2 flex flex-col items-center gap-2 transition-all',
                                                orientation === 'portrait'
                                                    ? 'border-red-600 bg-red-50/50 text-red-700 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            )}
                                        >
                                            <div className="w-6 h-8 border-2 border-current rounded-sm flex items-center justify-center">
                                                <div className="w-3 h-4 bg-current/20 rounded-sm" />
                                            </div>
                                            <span className="text-xs font-bold">Portrait</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setOrientation('landscape')}
                                            className={clsx(
                                                'p-3.5 rounded-xl border-2 flex flex-col items-center gap-2 transition-all',
                                                orientation === 'landscape'
                                                    ? 'border-red-600 bg-red-50/50 text-red-700 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            )}
                                        >
                                            <div className="w-8 h-6 border-2 border-current rounded-sm flex items-center justify-center">
                                                <div className="w-4 h-3 bg-current/20 rounded-sm" />
                                            </div>
                                            <span className="text-xs font-bold">Landscape</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Page Size */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                                        Page Size
                                    </label>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => setPageSize(e.target.value as PageSize)}
                                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 font-medium text-sm text-gray-800 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                    >
                                        <option value="A4">A4 (297 × 210 mm) - Standard</option>
                                        <option value="Letter">US Letter (216 × 279 mm)</option>
                                        <option value="fit">Fit (Same page size as image)</option>
                                    </select>
                                </div>

                                {/* 3. Margin */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                                        Margin
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'none', label: 'No margin', desc: 'Full bleed' },
                                            { id: 'small', label: 'Small', desc: '0.25 in' },
                                            { id: 'big', label: 'Big', desc: '0.75 in' },
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setMargin(m.id as MarginSize)}
                                                className={clsx(
                                                    'p-3 rounded-xl border-2 flex flex-col items-center text-center transition-all',
                                                    margin === m.id
                                                        ? 'border-red-600 bg-red-50/50 text-red-700 font-bold shadow-sm'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                )}
                                            >
                                                <span className="text-xs font-semibold">{m.label}</span>
                                                <span className="text-[10px] text-gray-400 mt-0.5">{m.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Merge All Toggle */}
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200/80 cursor-pointer hover:bg-gray-100/70 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={mergeAll}
                                            onChange={(e) => setMergeAll(e.target.checked)}
                                            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                                        />
                                        <span className="text-xs font-semibold text-gray-800">
                                            Merge all images into a single PDF
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Convert Button */}
                            <div className="pt-6 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={handleConvert}
                                    disabled={isProcessing || images.length === 0}
                                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-95 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Convert to PDF</span>
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs">
                                                ➔
                                            </span>
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[11px] text-gray-400 mt-2">
                                    Fast 1-click processing • Instant download
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* STATE 3: SUCCESS / DOWNLOAD VIEW */}
                {resultUrl && (
                    <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 max-w-xl mx-auto w-full">
                        <div className="w-full bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-xl text-center animate-in zoom-in-95 duration-200">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <Check className="w-10 h-10 stroke-[3]" />
                            </div>

                            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                                The PDF has been converted!
                            </h2>
                            <p className="text-gray-500 text-sm mb-8">
                                {images.length} images were compiled into high-resolution PDF with {orientation} orientation.
                            </p>

                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="w-full py-4 px-8 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-lg shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-3"
                                >
                                    <Download className="w-6 h-6" /> Download PDF
                                </button>

                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="w-full py-3 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Convert other images
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* PROCESSING MODAL OVERLAY */}
            {isProcessing && (
                <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                Creating your PDF...
                            </h3>
                            <p className="text-xs text-gray-500">
                                Rendering pages, applying orientation & high-dpi compression
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-red-500 to-rose-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${processProgress}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold text-gray-500">{processProgress}%</span>
                    </div>
                </div>
            )}
        </div>
    );
}
