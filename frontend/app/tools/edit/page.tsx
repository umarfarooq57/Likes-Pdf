'use client';

import Link from 'next/link';
import { ArrowLeft, Edit3, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function PDFEditorPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-12 text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to All Tools
                </Link>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-10 shadow-sm border border-gray-100 max-w-xl mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-md shadow-violet-500/20">
                        <Edit3 className="w-8 h-8 text-white" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        Coming Soon
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-3">PDF Editor</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Full-canvas interactive annotations, drawing tools, and vector text editing are being prepared for an upcoming release.
                    </p>

                    <Link
                        href="/tools"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary-600 hover:primary-700 text-white font-medium shadow-sm transition-all"
                    >
                        Explore Available Tools
                    </Link>
                </div>
            </div>
        </main>
    );
}
