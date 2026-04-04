'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import FileDropzone from '@/components/FileDropzone';
import DownloadButton from '@/components/DownloadButton';
import { documentsApi, optimizationApi } from '@/lib/api';

type Quality = 'low' | 'medium' | 'high';

export default function CompressPage() {
    const [fileId, setFileId] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [quality, setQuality] = useState<Quality>('medium');
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
            toast.error(error?.response?.data?.detail || error?.message || 'Something went wrong');
        }
    };

    const handleCompress = async () => {
        if (!fileId) {
            toast.error('Please upload a PDF first');
            return;
        }

        setIsProcessing(true);
        setDownloadUrl(null);
        try {
            const result = await optimizationApi.compress(fileId, quality);
            const url = result.download_url || result.url;
            if (!url) throw new Error('No download URL was returned');
            setDownloadUrl(url);
            toast.success('Compression completed');
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error?.message || 'Something went wrong');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
                <Link href="/tools" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tools
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Compress PDF</h1>

                {!fileId ? (
                    <FileDropzone onFilesSelected={handleFilesSelected} maxFiles={1} acceptedTypes={['application/pdf']} />
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <p className="text-sm text-gray-700">Selected file: {fileName}</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                            <select
                                value={quality}
                                onChange={(e) => setQuality(e.target.value as Quality)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <button
                            onClick={handleCompress}
                            disabled={isProcessing}
                            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-60"
                        >
                            {isProcessing ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Compressing...
                                </span>
                            ) : (
                                'Compress PDF'
                            )}
                        </button>
                        {downloadUrl && (
                            <DownloadButton
                                url={downloadUrl}
                                fallbackName={fileName.replace(/\.pdf$/i, '') + '-compressed.pdf'}
                                className="inline-flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-lg font-semibold"
                            >
                                Download Compressed PDF
                            </DownloadButton>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
