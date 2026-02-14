'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, Unlock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import toast from 'react-hot-toast';
import { documentsApi, securityApi } from '@/lib/api';

interface UploadedFile {
    id: string;
    filename: string;
    size: number;
}

export default function UnlockPDFPage() {
    const [file, setFile] = useState<UploadedFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversionId, setConversionId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProtected, setIsProtected] = useState<boolean | null>(null);

    const handleFilesSelected = async (selectedFiles: File[]) => {
        if (selectedFiles.length > 0) {
            try {
                const result = await documentsApi.upload(selectedFiles[0]);
                setFile({ id: result.id, filename: result.filename, size: result.size });

                // Check if file is protected
                try {
                    const protectionStatus = await securityApi.checkProtection(result.id);
                    setIsProtected(protectionStatus.is_encrypted);
                } catch {
                    setIsProtected(null);
                }

                toast.success('File uploaded successfully');
            } catch (error) {
                toast.error('Failed to upload file');
            }
        }
    };

    const handleUnlock = async () => {
        if (!file) {
            toast.error('Please upload a PDF file first');
            return;
        }

        if (!password) {
            toast.error('Please enter the password');
            return;
        }

        setIsProcessing(true);

        try {
            const result = await securityApi.unlock(file.id, password);
            setConversionId(result.id);
        } catch (error) {
            toast.error('Failed to unlock PDF. Check your password.');
            setIsProcessing(false);
        }
    };

    const handleComplete = (url: string) => {
        setResultUrl(url);
        setIsProcessing(false);
        toast.success('PDF unlocked successfully!');
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
        setPassword('');
        setIsProtected(null);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
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
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <Unlock className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Unlock PDF</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Remove password protection from your PDF documents.
                        You need to know the password to unlock the file.
                    </p>
                </div>

                {/* Main Content */}
                <div className="card">
                    {!conversionId ? (
                        <>
                            {/* File Upload */}
                            {!file ? (
                                <FileDropzone
                                    accept={{ 'application/pdf': ['.pdf'] }}
                                    onFilesSelected={handleFilesSelected}
                                    multiple={false}
                                />
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-green-600" />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{file.filename}</p>
                                            <p className="text-sm text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setFile(null);
                                                setIsProtected(null);
                                            }}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    {/* Protection Status */}
                                    {isProtected === false && (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
                                            <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                            <div>
                                                <p className="font-medium text-yellow-800">
                                                    This PDF is not password protected
                                                </p>
                                                <p className="text-sm text-yellow-700">
                                                    You can use this file directly without unlocking.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {isProtected === true && (
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                                            <Unlock className="w-6 h-6 text-blue-600" />
                                            <div>
                                                <p className="font-medium text-blue-800">
                                                    This PDF is password protected
                                                </p>
                                                <p className="text-sm text-blue-700">
                                                    Enter the password below to unlock it.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Password Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            PDF Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter the password to unlock"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Unlock Button */}
                                    <button
                                        onClick={handleUnlock}
                                        disabled={isProcessing || !password}
                                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Unlocking...
                                            </>
                                        ) : (
                                            <>
                                                <Unlock className="w-5 h-5" />
                                                Unlock PDF
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
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
                                        Download Unlocked PDF
                                    </a>
                                    <button
                                        onClick={resetTool}
                                        className="btn-secondary"
                                    >
                                        Unlock Another
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Info */}
                <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-2">Important Notes</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• You must know the password to unlock a protected PDF</li>
                        <li>• We cannot recover or bypass forgotten passwords</li>
                        <li>• Only unlock PDFs you have permission to access</li>
                        <li>• Your files are processed securely and deleted after processing</li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
