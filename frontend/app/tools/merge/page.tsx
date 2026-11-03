'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
    FileText,
    ArrowLeft,
    Download,
    Loader2,
    X,
    GripVertical,
    Trash2,
    Plus,
    ArrowUpDown,
    Check,
    CheckCircle2,
    Layers,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    SlidersHorizontal,
    FilePlus,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import DownloadButton from '@/components/DownloadButton';
import toast from 'react-hot-toast';
import { documentsApi, editingApi, extractErrorMessage } from '@/lib/api';
import { clsx } from 'clsx';

interface StudioPdfFile {
    id: string;
    documentId?: string;
    file: File;
    filename: string;
    size: number;
    status: 'uploading' | 'ready' | 'error';
}

export default function MergePDFPage() {
    const [files, setFiles] = useState<StudioPdfFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [resultFilename, setResultFilename] = useState<string>('merged_document.pdf');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadTaskRef = useRef<Promise<any> | null>(null);
    const filesRef = useRef<StudioPdfFile[]>([]);

    const handleAddFiles = async (selectedFiles: FileList | File[]) => {
        const fileArr = Array.from(selectedFiles).filter(
            (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
        );

        if (fileArr.length === 0) {
            toast.error('Please select valid PDF files');
            return;
        }

        const newItems: StudioPdfFile[] = fileArr.map((f) => ({
            id: Math.random().toString(36).substring(2, 9),
            file: f,
            filename: f.name,
            size: f.size,
            status: 'uploading',
        }));

        setFiles((prev) => {
            const next = [...prev, ...newItems];
            filesRef.current = next;
            return next;
        });

        // Fast parallel upload
        const uploadTask = Promise.all(
            newItems.map(async (item) => {
                try {
                    const uploaded = await documentsApi.upload(item.file);
                    const docId = uploaded.id || (uploaded as any).file_id;
                    item.documentId = docId;
                    item.status = 'ready';
                    setFiles((prev) => {
                        const next: StudioPdfFile[] = prev.map((f) =>
                            f.id === item.id ? { ...f, documentId: docId, status: 'ready' as const } : f
                        );
                        filesRef.current = next;
                        return next;
                    });
                    return docId;
                } catch (err) {
                    item.status = 'error';
                    setFiles((prev) => {
                        const next: StudioPdfFile[] = prev.map((f) =>
                            f.id === item.id ? { ...f, status: 'error' as const } : f
                        );
                        filesRef.current = next;
                        return next;
                    });
                    toast.error(extractErrorMessage(err) || `Failed to upload ${item.filename}`);
                    return null;
                }
            })
        );

        uploadTaskRef.current = uploadTask;
    };

    const removeFile = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const moveFile = (from: number, to: number) => {
        if (from < 0 || to < 0 || from >= files.length || to >= files.length) return;
        setFiles((prev) => {
            const copy = [...prev];
            const [item] = copy.splice(from, 1);
            copy.splice(to, 0, item);
            return copy;
        });
    };

    const sortFiles = (ascending: boolean) => {
        setFiles((prev) => {
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
        setFiles([]);
        setResultUrl(null);
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (targetIndex: number) => {
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            moveFile(draggedIndex, targetIndex);
        }
        setDraggedIndex(null);
    };

    const handleMerge = async () => {
        const currentList = filesRef.current.length > 0 ? filesRef.current : files;
        if (currentList.length < 2) {
            toast.error('Please upload at least 2 PDF files to merge');
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

            const validDocIds = (filesRef.current.length > 0 ? filesRef.current : files)
                .map((f) => f.documentId)
                .filter((id): id is string => Boolean(id));

            if (validDocIds.length < 2) {
                throw new Error('PDF files are still uploading. Please click merge again.');
            }

            setProcessProgress(70);

            const response = await editingApi.merge(validDocIds);
            clearInterval(progressInterval);
            setProcessProgress(100);

            const downloadUrl =
                response.download_url ||
                response.result_url ||
                `/api/v1/convert/${response.id}/download`;

            setResultUrl(downloadUrl);
            setResultFilename(
                response.result_filename ||
                response.filename ||
                `${files[0].filename.replace(/\.[^/.]+$/, '')}_merged.pdf`
            );
            toast.success('PDFs merged successfully!');
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
            link.download = resultFilename || 'merged_document.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Download started');
        } catch (err) {
            window.open(resultUrl, '_blank');
        }
    };

    const totalSizeMb = (
        files.reduce((acc, curr) => acc + curr.size, 0) /
        (1024 * 1024)
    ).toFixed(2);

    return (
        <div className="min-h-screen bg-[#f3f4f7] flex flex-col font-sans">
            <Navbar />

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files) {
                        handleAddFiles(e.target.files);
                    }
                    e.target.value = '';
                }}
            />

            <main className="flex-1 pt-16 flex flex-col">
                {/* 1. EMPTY STATE / INITIAL UPLOAD VIEW */}
                {files.length === 0 && !resultUrl && (
                    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 max-w-4xl mx-auto w-full">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-xl shadow-red-500/20 mb-5 transform hover:scale-105 transition-transform duration-300">
                                <Layers className="w-10 h-10" />
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
                                Merge PDF Files
                            </h1>
                            <p className="text-lg text-gray-600 max-w-xl mx-auto">
                                Combine multiple PDFs in the exact order you want with our instant high-fidelity engine.
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
                                <FilePlus className="w-10 h-10 transform group-hover:-translate-y-1 transition-transform duration-200" />
                            </div>

                            <button
                                type="button"
                                className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-lg shadow-lg shadow-red-600/30 transition-all flex items-center gap-3 mb-4"
                            >
                                <Plus className="w-6 h-6" /> Select PDF Files
                            </button>

                            <p className="text-gray-500 font-medium text-sm sm:text-base">
                                or drop PDF files here
                            </p>
                        </div>
                    </div>
                )}

                {/* 2. STUDIO WORKBENCH (iLovePDF Style Split Canvas + Sticky Options) */}
                {files.length > 0 && !resultUrl && (
                    <div className="flex-1 flex flex-col lg:flex-row h-full">
                        {/* LEFT: STUDIO CANVAS (70-75%) */}
                        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-[500px]">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
                                        {files.length}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                                            {files.length} PDF Files Selected
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Total size: {totalSizeMb} MB • Drag cards to reorder merged order
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => sortFiles(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="Sort A to Z"
                                    >
                                        <ArrowUpDown className="w-3.5 h-3.5" /> Sort A-Z
                                    </button>

                                    <button
                                        type="button"
                                        onClick={clearAll}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Clear
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                                        title="Add more PDF files"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                            {files.length}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                                {files.map((file, index) => (
                                    <div
                                        key={file.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(index)}
                                        className={clsx(
                                            'group relative bg-white rounded-2xl border-2 transition-all duration-200 flex flex-col shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing overflow-hidden aspect-[3/4]',
                                            draggedIndex === index
                                                ? 'opacity-40 border-dashed border-red-500 scale-95'
                                                : 'border-gray-200 hover:border-red-400'
                                        )}
                                    >
                                        {/* Card Top: Order Badge and Delete */}
                                        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
                                            <span className="px-2 py-0.5 rounded-md bg-gray-900/80 backdrop-blur-sm text-white text-[11px] font-bold shadow">
                                                {index + 1}
                                            </span>

                                            <div className="flex items-center pointer-events-auto opacity-90 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => removeFile(file.id, e)}
                                                    className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-gray-700 hover:text-red-600 shadow flex items-center justify-center transition-all hover:scale-105"
                                                    title="Remove PDF"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Document Visual Card */}
                                        <div className="flex-1 w-full p-4 flex flex-col items-center justify-center overflow-hidden bg-slate-50/70">
                                            <div className="w-16 h-20 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-1 group-hover:scale-105 transition-transform duration-200">
                                                <FileText className="w-8 h-8 text-red-500" />
                                                <span className="text-[9px] font-bold text-gray-400 tracking-wider">
                                                    PDF
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="p-2.5 bg-white border-t border-gray-100 flex items-center justify-between gap-1">
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className="text-xs font-medium text-gray-800 truncate"
                                                    title={file.filename}
                                                >
                                                    {file.filename}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                            </div>

                                            {/* Micro-arrow reorder */}
                                            <div className="flex items-center -space-x-1">
                                                <button
                                                    type="button"
                                                    disabled={index === 0}
                                                    onClick={() => moveFile(index, index - 1)}
                                                    className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-20"
                                                    title="Move left"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === files.length - 1}
                                                    onClick={() => moveFile(index, index + 1)}
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
                                    className="rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-400 bg-white/60 hover:bg-white flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-200 group text-center aspect-[3/4]"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center mb-2 transition-all">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 group-hover:text-red-600">
                                        Add more PDFs
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: STUDIO SIDEBAR OPTIONS (28-30%) */}
                        <div className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-6 flex flex-col justify-between shadow-xl z-20">
                            <div className="space-y-6">
                                <div className="border-b border-gray-100 pb-4">
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <SlidersHorizontal className="w-5 h-5 text-red-600" />
                                        Merge PDF options
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Combine documents into a single master PDF
                                    </p>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                        Merge Summary
                                    </span>
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>Total Documents:</span>
                                        <span className="font-bold text-gray-900">{files.length}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>Total Payload:</span>
                                        <span className="font-bold text-gray-900">{totalSizeMb} MB</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200 text-[11px] text-gray-500">
                                        💡 To change the order of your PDFs, drag and drop the document cards on the canvas.
                                    </div>
                                </div>
                            </div>

                            {/* Merge CTA Button */}
                            <div className="pt-6 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={handleMerge}
                                    disabled={isProcessing || files.length < 2}
                                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-95 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Merging PDFs...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Merge PDF</span>
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs">
                                                ➔
                                            </span>
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[11px] text-gray-400 mt-2">
                                    Fast & secure • Instant 1-click download
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. SUCCESS / DOWNLOAD VIEW */}
                {resultUrl && (
                    <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 max-w-xl mx-auto w-full">
                        <div className="w-full bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-xl text-center animate-in zoom-in-95 duration-200">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <Check className="w-10 h-10 stroke-[3]" />
                            </div>

                            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                                PDFs have been merged!
                            </h2>
                            <p className="text-gray-500 text-sm mb-8">
                                {files.length} documents have been combined into a single unified PDF file.
                            </p>

                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="w-full py-4 px-8 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-lg shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-3"
                                >
                                    <Download className="w-6 h-6" /> Download Merged PDF
                                </button>

                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="w-full py-3 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Merge more files
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* PROCESSING OVERLAY */}
            {isProcessing && (
                <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                Merging your PDFs...
                            </h3>
                            <p className="text-xs text-gray-500">
                                Combining document streams and bookmarks into a unified file
                            </p>
                        </div>

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
