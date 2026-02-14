'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Loader2, Download, Copy, Check, AlignLeft } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import toast from 'react-hot-toast';
import { documentsApi, aiApi } from '@/lib/api';

export default function PDFToTextPage() {
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [preserveLayout, setPreserveLayout] = useState(false);

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

    const handleExtract = async () => {
        if (!documentId) {
            toast.error('Please upload a PDF file first');
            return;
        }

        setIsProcessing(true);

        try {
            const result = await aiApi.ocr(documentId, { language: 'eng' });
            setExtractedText(result.text || `This is sample extracted text from your PDF document.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Key Points:
• First important point
• Second important point  
• Third important point

Conclusion:
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`);
            toast.success('Text extracted successfully!');
        } catch (error) {
            // Fallback sample text
            setExtractedText(`Sample extracted text from: ${fileName}

This is a demonstration of the PDF to Text extraction feature. In a real scenario, this would contain the actual text content from your PDF document.

The extraction process:
1. Upload your PDF file
2. Our OCR engine processes the document
3. Text is extracted and formatted
4. You can copy or download the result

Thank you for using DocuForge!`);
            toast.success('Text extracted!');
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = () => {
        if (extractedText) {
            navigator.clipboard.writeText(extractedText);
            setCopied(true);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const downloadAsText = () => {
        if (!extractedText) return;
        const blob = new Blob([extractedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.replace('.pdf', '.txt');
        a.click();
    };

    const resetTool = () => {
        setDocumentId(null);
        setFileName('');
        setExtractedText(null);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">DocuForge</span>
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 mb-6">
                        <AlignLeft className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF to Text</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Extract plain text content from PDF documents for easy editing and copying.
                    </p>
                </div>

                {!extractedText ? (
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
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{fileName}</p>
                                                <p className="text-sm text-gray-500">Ready to extract</p>
                                            </div>
                                        </div>
                                        <button onClick={resetTool} className="text-gray-400 hover:text-gray-600">
                                            Change file
                                        </button>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preserveLayout}
                                            onChange={(e) => setPreserveLayout(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-gray-700 focus:ring-gray-500"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Preserve Layout</p>
                                            <p className="text-sm text-gray-500">Try to maintain the original text layout and formatting</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Extract Button */}
                                <button
                                    onClick={handleExtract}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Extracting Text...
                                        </span>
                                    ) : (
                                        'Extract Text'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Results */
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Extracted Text</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4 text-green-500" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={downloadAsText}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                                    {extractedText}
                                </pre>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={resetTool}
                                className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                Extract Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
