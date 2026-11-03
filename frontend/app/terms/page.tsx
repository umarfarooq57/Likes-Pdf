import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function TermsPage() {
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
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
                            <p className="text-sm text-gray-500">Last updated: October 2024</p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-6 text-gray-600">
                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using DocuForge services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-gray-900">2. Permitted Use</h2>
                            <p>
                                You agree to use DocuForge solely for lawful purposes. You may not upload files that contain malicious code, violate intellectual property rights, or infringe on applicable laws.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-gray-900">3. Intellectual Property</h2>
                            <p>
                                You retain all rights and ownership over any documents and files you upload to DocuForge. We claim no ownership over your content.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-gray-900">4. Service Availability & Disclaimers</h2>
                            <p>
                                We strive for 99.9% uptime, but provide services "as is" and "as available". We recommend keeping local copies of your original files.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-gray-900">5. Contact</h2>
                            <p>
                                For questions regarding these terms, contact us at <a href="mailto:legal@docuforge.io" className="text-primary-600 hover:underline">legal@docuforge.io</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
