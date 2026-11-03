import Link from 'next/link';
import { Lock, ArrowLeft, ShieldCheck, KeyRound, Server, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Security & Encryption</h1>
                            <p className="text-sm text-gray-500">Enterprise protection built into every tool</p>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <KeyRound className="w-6 h-6 text-primary-600 mb-2" />
                            <h3 className="font-semibold text-gray-900 mb-1">AES-256 Bit Encryption</h3>
                            <p className="text-sm text-gray-600">All stored files use military-grade AES-256 resting encryption.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <ShieldCheck className="w-6 h-6 text-emerald-600 mb-2" />
                            <h3 className="font-semibold text-gray-900 mb-1">TLS 1.3 in Transit</h3>
                            <p className="text-sm text-gray-600">Data transfers are shielded end-to-end with high-assurance HTTPS/TLS 1.3.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <RefreshCw className="w-6 h-6 text-indigo-600 mb-2" />
                            <h3 className="font-semibold text-gray-900 mb-1">Automated Deletion</h3>
                            <p className="text-sm text-gray-600">Temporary processing files are shredded and deleted automatically after 24 hours.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <Server className="w-6 h-6 text-amber-600 mb-2" />
                            <h3 className="font-semibold text-gray-900 mb-1">Zero Data Training</h3>
                            <p className="text-sm text-gray-600">We never feed your confidential PDFs into any AI or machine learning models.</p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-4 text-gray-600">
                        <h2 className="text-xl font-semibold text-gray-900">Responsible Disclosure</h2>
                        <p>
                            If you discover any security vulnerability, please report it immediately to{' '}
                            <a href="mailto:security@docuforge.io" className="text-primary-600 hover:underline">security@docuforge.io</a>.
                            Our team investigates all reports promptly.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
