'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Loader2, ShieldCheck, Key, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import FileDropzone from '@/components/FileDropzone';
import DownloadButton from '@/components/DownloadButton';
import { documentsApi, securityApi, extractErrorMessage } from '@/lib/api';

export default function ProtectPDFPage() {
    const [fileId, setFileId] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];
        try {
            const uploaded = await documentsApi.upload(file);
            setFileId(uploaded.id || null);
            setFileName(uploaded.filename || file.name);
            setDownloadUrl(null);
            toast.success('PDF uploaded successfully');
        } catch (error: any) {
            toast.error(extractErrorMessage(error));
        }
    };

    const handleProtect = async () => {
        if (!fileId) {
            toast.error('Please upload a PDF first');
            return;
        }
        if (!password) {
            toast.error('Please enter a password');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsProcessing(true);
        setDownloadUrl(null);
        try {
            const result = await securityApi.addPassword(fileId, password);
            const url = result.download_url || (result.result_document_id ? `/api/v1/documents/${result.result_document_id}/download` : null);
            if (!url) throw new Error('No download URL returned');
            setDownloadUrl(url);
            toast.success('PDF protected successfully!');
        } catch (error: any) {
            toast.error(extractErrorMessage(error));
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTool = () => {
        setFileId(null);
        setFileName('');
        setPassword('');
        setConfirmPassword('');
        setDownloadUrl(null);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
                <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to All Tools
                </Link>

                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Protect PDF</h1>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Encrypt your PDF document with strong password protection to prevent unauthorized viewing.
                    </p>
                </div>

                {!fileId ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <FileDropzone
                            onFilesSelected={handleFilesSelected}
                            maxFiles={1}
                            acceptedTypes={['application/pdf']}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold">
                                    PDF
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">{fileName}</p>
                                    <p className="text-xs text-gray-500">Ready for encryption</p>
                                </div>
                            </div>
                            <button
                                onClick={resetTool}
                                className="text-xs text-gray-500 hover:text-gray-800 underline"
                            >
                                Change file
                            </button>
                        </div>

                        {!downloadUrl ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Set Document Password
                                    </label>
                                    <div className="relative">
                                        <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter strong password"
                                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter password"
                                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleProtect}
                                    disabled={isProcessing || !password}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-red-500/20 disabled:opacity-50 transition-all"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Encrypting Document...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-5 h-5" />
                                            Protect PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-6 space-y-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Your PDF is Protected!</h3>
                                <p className="text-sm text-gray-500">
                                    The document is now encrypted and requires your password to open.
                                </p>
                                <div className="max-w-xs mx-auto pt-2">
                                    <DownloadButton
                                        url={downloadUrl}
                                        fallbackName={`protected_${fileName}`}
                                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-base"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Protected PDF
                                    </DownloadButton>
                                </div>
                                <button
                                    onClick={resetTool}
                                    className="block mx-auto text-xs text-gray-500 hover:text-gray-800 pt-2"
                                >
                                    Protect another document
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
