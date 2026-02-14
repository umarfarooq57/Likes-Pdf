'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import ProgressTracker from '@/components/ProgressTracker';
import toast from 'react-hot-toast';
import { documentsApi, securityApi } from '@/lib/api';

interface UploadedFile {
    id: string;
    filename: string;
    size: number;
}

export default function ProtectPDFPage() {
    const [file, setFile] = useState<UploadedFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversionId, setConversionId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const [userPassword, setUserPassword] = useState('');
    const [ownerPassword, setOwnerPassword] = useState('');
    const [showUserPassword, setShowUserPassword] = useState(false);
    const [showOwnerPassword, setShowOwnerPassword] = useState(false);
    const [permissions, setPermissions] = useState({
        print: true,
        copy: false,
        modify: false,
        annotate: true,
    });

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

    const handleProtect = async () => {
        if (!file) {
            toast.error('Please upload a PDF file first');
            return;
        }

        if (!userPassword && !ownerPassword) {
            toast.error('Please set at least one password');
            return;
        }

        setIsProcessing(true);

        try {
            const permissionsList = Object.entries(permissions)
                .filter(([_, value]) => value)
                .map(([key]) => key);

            const result = await securityApi.protect(
                file.id,
                userPassword || undefined,
                ownerPassword || undefined,
                permissionsList
            );
            setConversionId(result.id);
        } catch (error) {
            toast.error('Failed to protect PDF');
            setIsProcessing(false);
        }
    };

    const handleComplete = (url: string) => {
        setResultUrl(url);
        setIsProcessing(false);
        toast.success('PDF protected successfully!');
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
        setUserPassword('');
        setOwnerPassword('');
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
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
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                        <Lock className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Protect PDF</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Add password protection and set permissions for your PDF documents.
                        Secure your sensitive files with industry-standard encryption.
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
                            )}

                            {/* Password Options */}
                            {file && (
                                <div className="mt-8 space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Password Protection</h3>

                                    {/* User Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            User Password (to open document)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showUserPassword ? 'text' : 'password'}
                                                value={userPassword}
                                                onChange={(e) => setUserPassword(e.target.value)}
                                                placeholder="Enter password to open PDF"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowUserPassword(!showUserPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showUserPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Required to open and view the PDF
                                        </p>
                                    </div>

                                    {/* Owner Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Owner Password (for permissions)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showOwnerPassword ? 'text' : 'password'}
                                                value={ownerPassword}
                                                onChange={(e) => setOwnerPassword(e.target.value)}
                                                placeholder="Enter owner password"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showOwnerPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Required to change permissions and security settings
                                        </p>
                                    </div>

                                    {/* Permissions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Document Permissions
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(permissions).map(([key, value]) => (
                                                <label
                                                    key={key}
                                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={value}
                                                        onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                                                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                    />
                                                    <span className="text-gray-700 capitalize">{key}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Protect Button */}
                                    <button
                                        onClick={handleProtect}
                                        disabled={isProcessing || (!userPassword && !ownerPassword)}
                                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Protecting...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-5 h-5" />
                                                Protect PDF
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
                                        Download Protected PDF
                                    </a>
                                    <button
                                        onClick={resetTool}
                                        className="btn-secondary"
                                    >
                                        Protect Another
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
