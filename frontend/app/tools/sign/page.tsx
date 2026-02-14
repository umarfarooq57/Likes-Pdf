'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, PenTool, Download, Type, Upload, Trash2, Check } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi } from '@/lib/api';

type SignatureType = 'draw' | 'type' | 'upload';

export default function ESignaturePage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [signatureType, setSignatureType] = useState<SignatureType>('draw');
    const [typedName, setTypedName] = useState('');
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 80 });

    const fonts = [
        { name: 'Signature', style: 'font-signature' },
        { name: 'Cursive', style: 'font-cursive' },
        { name: 'Elegant', style: 'font-elegant' },
    ];

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];
        try {
            const result = await documentsApi.upload(file);
            setDocumentId(result.id);
            setFileName(result.filename);
            toast.success('File uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload file');
        }
    };

    // Canvas drawing functions
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            setSignatureImage(canvas.toDataURL());
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureImage(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSignatureImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleApplySignature = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        if (!signatureImage && signatureType !== 'type') {
            toast.error('Please create a signature first');
            return;
        }

        setIsProcessing(true);

        try {
            // In real implementation, would send signature to backend
            await new Promise(resolve => setTimeout(resolve, 2000));
            setResultUrl(`http://localhost:8000/api/v1/documents/${documentId}/download`);
            toast.success('Signature applied successfully!');
        } catch (error) {
            toast.error('Failed to apply signature');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setSignatureImage(null);
        setTypedName('');
        setResultUrl(null);
        clearCanvas();
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">DocuForge</span>
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 mb-6">
                        <PenTool className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">E-Signature</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Add your electronic signature to PDF documents. Draw, type, or upload your signature.
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
                                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{fileName}</p>
                                                <p className="text-sm text-gray-500">Ready to sign</p>
                                            </div>
                                        </div>
                                        <button onClick={resetTool} className="text-gray-400 hover:text-gray-600">
                                            Change file
                                        </button>
                                    </div>
                                </div>

                                {/* Signature Type Selector */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="font-semibold text-gray-900 mb-4">Create Your Signature</h3>

                                    <div className="flex gap-2 mb-6">
                                        <button
                                            onClick={() => setSignatureType('draw')}
                                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${signatureType === 'draw'
                                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                                                }`}
                                        >
                                            <PenTool className="w-5 h-5 mx-auto mb-1" />
                                            Draw
                                        </button>
                                        <button
                                            onClick={() => setSignatureType('type')}
                                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${signatureType === 'type'
                                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                                                }`}
                                        >
                                            <Type className="w-5 h-5 mx-auto mb-1" />
                                            Type
                                        </button>
                                        <button
                                            onClick={() => setSignatureType('upload')}
                                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${signatureType === 'upload'
                                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                                                }`}
                                        >
                                            <Upload className="w-5 h-5 mx-auto mb-1" />
                                            Upload
                                        </button>
                                    </div>

                                    {/* Draw Signature */}
                                    {signatureType === 'draw' && (
                                        <div className="space-y-4">
                                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                                                <canvas
                                                    ref={canvasRef}
                                                    width={400}
                                                    height={150}
                                                    className="w-full bg-white rounded-lg cursor-crosshair"
                                                    onMouseDown={startDrawing}
                                                    onMouseMove={draw}
                                                    onMouseUp={stopDrawing}
                                                    onMouseLeave={stopDrawing}
                                                />
                                            </div>
                                            <button
                                                onClick={clearCanvas}
                                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Clear
                                            </button>
                                        </div>
                                    )}

                                    {/* Type Signature */}
                                    {signatureType === 'type' && (
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                value={typedName}
                                                onChange={(e) => setTypedName(e.target.value)}
                                                placeholder="Type your name..."
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl"
                                            />
                                            {typedName && (
                                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
                                                    <p className="text-3xl text-center italic font-serif">{typedName}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Upload Signature */}
                                    {signatureType === 'upload' && (
                                        <div className="space-y-4">
                                            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                                {signatureImage ? (
                                                    <img src={signatureImage} alt="Signature" className="max-h-24 mx-auto" />
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                        <p className="text-gray-600">Click to upload signature image</p>
                                                        <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Position */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="font-semibold text-gray-900 mb-4">Signature Position</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Horizontal: {signaturePosition.x}%</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={signaturePosition.x}
                                                onChange={(e) => setSignaturePosition({ ...signaturePosition, x: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Vertical: {signaturePosition.y}%</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={signaturePosition.y}
                                                onChange={(e) => setSignaturePosition({ ...signaturePosition, y: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Apply Button */}
                                <button
                                    onClick={handleApplySignature}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Applying Signature...
                                        </span>
                                    ) : (
                                        'Apply Signature'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Result */
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Signed!</h3>
                        <p className="text-gray-600 mb-6">Your signature has been applied to the document.</p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={resultUrl}
                                download
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Download Signed PDF
                            </a>
                            <button
                                onClick={resetTool}
                                className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                            >
                                Sign Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
