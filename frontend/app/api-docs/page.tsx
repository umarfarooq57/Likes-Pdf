'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
    FileText,
    Code,
    Key,
    Zap,
    Shield,
    Book,
    ChevronRight,
    Copy,
    Check,
    ArrowRight,
    Terminal,
    Globe,
    Lock,
} from 'lucide-react';

const endpoints = [
    {
        category: 'Document Operations',
        items: [
            {
                method: 'POST',
                path: '/api/v1/documents/merge',
                description: 'Merge multiple PDF files into one',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/documents/split',
                description: 'Split a PDF into multiple files',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/documents/compress',
                description: 'Compress PDF to reduce file size',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/documents/rotate',
                description: 'Rotate pages in a PDF',
                auth: true,
            },
            {
                method: 'DELETE',
                path: '/api/v1/documents/{id}/pages',
                description: 'Delete specific pages from a PDF',
                auth: true,
            },
        ],
    },
    {
        category: 'Conversions',
        items: [
            {
                method: 'POST',
                path: '/api/v1/convert/pdf-to-word',
                description: 'Convert PDF to Word document',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/convert/pdf-to-images',
                description: 'Convert PDF pages to images',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/convert/images-to-pdf',
                description: 'Combine images into a PDF',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/convert/html-to-pdf',
                description: 'Convert HTML content to PDF',
                auth: true,
            },
        ],
    },
    {
        category: 'Security',
        items: [
            {
                method: 'POST',
                path: '/api/v1/security/protect',
                description: 'Add password protection to PDF',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/security/unlock',
                description: 'Remove password from PDF',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/security/watermark',
                description: 'Add watermark to PDF',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/security/sign',
                description: 'Add digital signature to PDF',
                auth: true,
            },
        ],
    },
    {
        category: 'AI Features',
        items: [
            {
                method: 'POST',
                path: '/api/v1/ai/summarize',
                description: 'Generate AI summary of document',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/ai/chat',
                description: 'Chat with your PDF using AI',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/ai/extract',
                description: 'Extract structured data from PDF',
                auth: true,
            },
        ],
    },
    {
        category: 'OCR & Scanning',
        items: [
            {
                method: 'POST',
                path: '/api/v1/ocr/recognize',
                description: 'OCR text recognition on document',
                auth: true,
            },
            {
                method: 'POST',
                path: '/api/v1/ocr/searchable-pdf',
                description: 'Create searchable PDF from scan',
                auth: true,
            },
        ],
    },
];

const codeExamples = {
    curl: `curl -X POST "https://api.docuforge.com/api/v1/documents/merge" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "files=@document1.pdf" \\
  -F "files=@document2.pdf"`,
    python: `import requests

url = "https://api.docuforge.com/api/v1/documents/merge"
headers = {"Authorization": "Bearer YOUR_API_KEY"}

files = [
    ("files", open("document1.pdf", "rb")),
    ("files", open("document2.pdf", "rb")),
]

response = requests.post(url, headers=headers, files=files)
result = response.json()

# Download the merged PDF
download_url = result["download_url"]`,
    javascript: `const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const response = await fetch(
  'https://api.docuforge.com/api/v1/documents/merge',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
    },
    body: formData,
  }
);

const result = await response.json();
console.log(result.download_url);`,
};

export default function ApiDocsPage() {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [selectedLang, setSelectedLang] = useState<'curl' | 'python' | 'javascript'>('curl');

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const methodColors: Record<string, string> = {
        GET: 'bg-green-100 text-green-700',
        POST: 'bg-blue-100 text-blue-700',
        PUT: 'bg-yellow-100 text-yellow-700',
        DELETE: 'bg-red-100 text-red-700',
    };

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                DocuForge
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/tools" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                                All Tools
                            </Link>
                            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                                Pricing
                            </Link>
                            <Link href="/api-docs" className="text-blue-600 font-medium">
                                API
                            </Link>
                            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                            >
                                Get Started Free
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                        <Code className="w-4 h-4" />
                        REST API v1
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        DocuForge API Documentation
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Integrate powerful PDF processing capabilities into your applications.
                        Simple, reliable, and developer-friendly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register?plan=enterprise"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            <Key className="w-5 h-5" />
                            Get API Key
                        </Link>
                        <a
                            href="http://localhost:8000/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                        >
                            <Terminal className="w-5 h-5" />
                            Interactive Docs
                        </a>
                    </div>
                </div>
            </section>

            {/* Quick Start */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Start</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                                <Key className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">1. Get Your API Key</h3>
                            <p className="text-gray-600 text-sm">
                                Sign up for an Enterprise plan to receive your API key. Keys are managed in your dashboard.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                                <Globe className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">2. Make API Requests</h3>
                            <p className="text-gray-600 text-sm">
                                Use your API key in the Authorization header. All endpoints support JSON and multipart/form-data.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">3. Process Documents</h3>
                            <p className="text-gray-600 text-sm">
                                Upload files, receive task IDs, and download processed results. It's that simple!
                            </p>
                        </div>
                    </div>

                    {/* Code Example */}
                    <div className="bg-gray-900 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
                            <div className="flex gap-2">
                                {(['curl', 'python', 'javascript'] as const).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setSelectedLang(lang)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedLang === lang
                                                ? 'bg-blue-500 text-white'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => copyToClipboard(codeExamples[selectedLang], 'example')}
                                className="flex items-center gap-2 px-3 py-1 text-gray-400 hover:text-white transition-colors"
                            >
                                {copiedCode === 'example' ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                        <pre className="p-6 text-sm text-gray-300 overflow-x-auto">
                            <code>{codeExamples[selectedLang]}</code>
                        </pre>
                    </div>
                </div>
            </section>

            {/* Authentication */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <Lock className="w-6 h-6 text-blue-600" />
                        Authentication
                    </h2>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <p className="text-gray-600 mb-4">
                            All API requests require authentication using a Bearer token in the Authorization header:
                        </p>
                        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300">
                            Authorization: Bearer YOUR_API_KEY
                        </div>
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 text-sm">
                                <strong>Important:</strong> Keep your API key secure. Do not expose it in client-side code or public repositories.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Endpoints */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <Book className="w-6 h-6 text-blue-600" />
                        API Endpoints
                    </h2>

                    <div className="space-y-8">
                        {endpoints.map((category) => (
                            <div key={category.category} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900">{category.category}</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {category.items.map((endpoint) => (
                                        <div key={endpoint.path} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[endpoint.method]}`}>
                                                    {endpoint.method}
                                                </span>
                                                <code className="text-sm font-mono text-gray-700">{endpoint.path}</code>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-500">{endpoint.description}</span>
                                                {endpoint.auth && (
                                                    <Lock className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Rate Limits */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <Shield className="w-6 h-6 text-blue-600" />
                        Rate Limits
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Plan</th>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Requests/Minute</th>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Requests/Day</th>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Max File Size</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 px-4 font-medium">Free</td>
                                    <td className="py-3 px-4 text-gray-600">10</td>
                                    <td className="py-3 px-4 text-gray-600">100</td>
                                    <td className="py-3 px-4 text-gray-600">10 MB</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 px-4 font-medium">Pro</td>
                                    <td className="py-3 px-4 text-gray-600">60</td>
                                    <td className="py-3 px-4 text-gray-600">1,000</td>
                                    <td className="py-3 px-4 text-gray-600">100 MB</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 font-medium">Enterprise</td>
                                    <td className="py-3 px-4 text-gray-600">Unlimited</td>
                                    <td className="py-3 px-4 text-gray-600">Unlimited</td>
                                    <td className="py-3 px-4 text-gray-600">Unlimited</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Integrate?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Get your API key and start building powerful document processing features today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register?plan=enterprise"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            Get API Key
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a
                            href="http://localhost:8000/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
                        >
                            View Full Docs
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">DocuForge</span>
                    </div>
                    <p className="mb-6">Enterprise PDF Platform with AI-Powered Features</p>
                    <div className="flex justify-center gap-8 text-sm">
                        <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
                        <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link href="/api-docs" className="hover:text-white transition-colors">API</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                    <p className="mt-8 text-sm">© 2026 DocuForge. All rights reserved.</p>
                </div>
            </footer>
        </main>
    );
}
