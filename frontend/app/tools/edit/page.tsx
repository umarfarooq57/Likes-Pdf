'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, Edit3, Type, Square, Circle, Minus, Download, Undo, Redo, ZoomIn, ZoomOut, Save, Palette, Move } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi } from '@/lib/api';

type Tool = 'select' | 'text' | 'rectangle' | 'circle' | 'line' | 'highlight';

interface Annotation {
    id: string;
    type: Tool;
    x: number;
    y: number;
    width?: number;
    height?: number;
    text?: string;
    color: string;
    page: number;
}

export default function PDFEditorPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [zoom, setZoom] = useState(100);
    const [selectedTool, setSelectedTool] = useState<Tool>('select');
    const [selectedColor, setSelectedColor] = useState('#FF0000');
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [history, setHistory] = useState<Annotation[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const canvasRef = useRef<HTMLDivElement>(null);

    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF'];

    const tools: { id: Tool; icon: React.ReactNode; name: string }[] = [
        { id: 'select', icon: <Move className="w-5 h-5" />, name: 'Select' },
        { id: 'text', icon: <Type className="w-5 h-5" />, name: 'Add Text' },
        { id: 'rectangle', icon: <Square className="w-5 h-5" />, name: 'Rectangle' },
        { id: 'circle', icon: <Circle className="w-5 h-5" />, name: 'Circle' },
        { id: 'line', icon: <Minus className="w-5 h-5" />, name: 'Line' },
        { id: 'highlight', icon: <Edit3 className="w-5 h-5" />, name: 'Highlight' },
    ];

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];
        setIsLoading(true);

        try {
            const result = await documentsApi.upload(file);
            setDocumentId(result.id);
            setFileName(result.filename);
            setTotalPages(result.page_count || 5);
            toast.success('PDF loaded successfully');
        } catch (error) {
            toast.error('Failed to load PDF');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (selectedTool === 'select') return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newAnnotation: Annotation = {
            id: Math.random().toString(36).substr(2, 9),
            type: selectedTool,
            x,
            y,
            width: selectedTool === 'text' ? undefined : 100,
            height: selectedTool === 'text' ? undefined : 50,
            text: selectedTool === 'text' ? 'Enter text...' : undefined,
            color: selectedColor,
            page: currentPage,
        };

        const newAnnotations = [...annotations, newAnnotation];
        setAnnotations(newAnnotations);

        // Update history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAnnotations);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setAnnotations(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setAnnotations(history[historyIndex + 1]);
        }
    };

    const handleSave = async () => {
        toast.success('PDF saved with annotations!');
        // In real implementation, would send annotations to backend
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setAnnotations([]);
        setHistory([[]]);
        setHistoryIndex(0);
    };

    const pageAnnotations = annotations.filter(a => a.page === currentPage);

    return (
        <main className="min-h-screen bg-gray-100">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-full mx-auto px-4">
                    <div className="flex justify-between items-center h-14">
                        <div className="flex items-center gap-4">
                            <Link href="/tools" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Link>
                            <div className="h-6 w-px bg-gray-200" />
                            <div className="flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-gray-900">PDF Editor</span>
                            </div>
                            {fileName && (
                                <span className="text-sm text-gray-500">{fileName}</span>
                            )}
                        </div>

                        {documentId && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={undo}
                                    disabled={historyIndex === 0}
                                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                    title="Undo"
                                >
                                    <Undo className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={redo}
                                    disabled={historyIndex === history.length - 1}
                                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                    title="Redo"
                                >
                                    <Redo className="w-5 h-5" />
                                </button>
                                <div className="h-6 w-px bg-gray-200 mx-2" />
                                <button
                                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ZoomOut className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-gray-600 w-12 text-center">{zoom}%</span>
                                <button
                                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ZoomIn className="w-5 h-5" />
                                </button>
                                <div className="h-6 w-px bg-gray-200 mx-2" />
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Save className="w-4 h-4" />
                                    Save
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {!documentId ? (
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 mb-6">
                            <Edit3 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF Editor</h1>
                        <p className="text-gray-600 max-w-xl mx-auto">
                            Add text, shapes, highlights, and annotations to your PDF documents.
                        </p>
                    </div>
                    <FileDropzone
                        onFilesSelected={handleFilesSelected}
                        maxFiles={1}
                        acceptedTypes={['application/pdf']}
                    />
                </div>
            ) : (
                <div className="flex h-[calc(100vh-56px)]">
                    {/* Toolbar */}
                    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
                        {tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setSelectedTool(tool.id)}
                                className={`p-3 rounded-lg transition-all ${selectedTool === tool.id
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                                title={tool.name}
                            >
                                {tool.icon}
                            </button>
                        ))}
                        <div className="h-px w-8 bg-gray-200 my-2" />
                        <div className="flex flex-col gap-1">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-6 h-6 rounded-full border-2 ${selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 overflow-auto bg-gray-200 p-8">
                        <div
                            ref={canvasRef}
                            onClick={handleCanvasClick}
                            className="bg-white shadow-lg mx-auto relative"
                            style={{
                                width: `${(612 * zoom) / 100}px`,
                                height: `${(792 * zoom) / 100}px`,
                                cursor: selectedTool === 'select' ? 'default' : 'crosshair',
                            }}
                        >
                            {/* Page Content Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                <div className="text-center">
                                    <FileText className="w-16 h-16 mx-auto mb-4" />
                                    <p>Page {currentPage} of {totalPages}</p>
                                </div>
                            </div>

                            {/* Annotations */}
                            {pageAnnotations.map((annotation) => (
                                <div
                                    key={annotation.id}
                                    className="absolute"
                                    style={{
                                        left: annotation.x,
                                        top: annotation.y,
                                        width: annotation.width,
                                        height: annotation.height,
                                    }}
                                >
                                    {annotation.type === 'text' && (
                                        <input
                                            type="text"
                                            defaultValue={annotation.text}
                                            className="bg-transparent border-none outline-none"
                                            style={{ color: annotation.color }}
                                        />
                                    )}
                                    {annotation.type === 'rectangle' && (
                                        <div
                                            className="w-full h-full border-2"
                                            style={{ borderColor: annotation.color }}
                                        />
                                    )}
                                    {annotation.type === 'circle' && (
                                        <div
                                            className="w-full h-full border-2 rounded-full"
                                            style={{ borderColor: annotation.color }}
                                        />
                                    )}
                                    {annotation.type === 'highlight' && (
                                        <div
                                            className="w-full h-full opacity-30"
                                            style={{ backgroundColor: annotation.color }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Page Navigation */}
                    <div className="w-24 bg-white border-l border-gray-200 p-2 overflow-y-auto">
                        <p className="text-xs text-gray-500 text-center mb-2">Pages</p>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-full aspect-[3/4] mb-2 rounded border-2 flex items-center justify-center text-sm font-medium ${currentPage === page
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}
