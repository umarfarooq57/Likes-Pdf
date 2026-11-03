'use client';

import Link from 'next/link';
import { ArrowLeft, GitCompare, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function ComparePDFPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
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
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-md shadow-cyan-500/20">
                        <GitCompare className="w-8 h-8 text-white" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        Coming Soon
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Compare PDFs</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Side-by-side visual diffs, text diff analysis, and structural page comparison are currently under development.
                    </p>

                    <Link
                        href="/tools"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-sm transition-all"
                    >
                        Explore Available Tools
                    </Link>
                </div>
            </div>
        </main>
    );
}
