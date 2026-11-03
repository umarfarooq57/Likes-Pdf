import Link from 'next/link';
import { Shield, ArrowLeft, Lock, Trash2, EyeOff } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function PrivacyPage() {
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
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
                            <p className="text-sm text-gray-500">Last updated: October 2024</p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-6 text-gray-600">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                            <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-900 m-0">
                                <strong>Your documents remain yours:</strong> All uploaded and processed files are encrypted in transit and automatically deleted permanently from our servers within 24 hours (or immediately upon user request).
                            </p>
                        </div>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-gray-900">1. Information We Collect</h2>
                            <p>
                                We only collect minimal information necessary to deliver our document conversion and processing services. This includes temporary file payloads submitted for processing and essential usage telemetry to ensure platform reliability.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-gray-900">2. How We Handle Your Files</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Temporary Storage:</strong> Files are stored solely for the purpose and duration of executing the requested document conversion or editing operation.</li>
                                <li><strong>Automatic Deletion:</strong> Files are purged automatically after 24 hours. We do not inspect, retain, or train AI models on your private documents.</li>
                                <li><strong>Encryption:</strong> All document transfers utilize TLS 1.3 encryption in transit and AES-256 encryption at rest.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-gray-900">3. Third-Party Sharing</h2>
                            <p>
                                We do not sell, rent, or trade your personal data or document contents with any third parties or advertisers.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-gray-900">4. Contact Us</h2>
                            <p>
                                If you have questions regarding this Privacy Policy or your personal data, reach out to our team at{' '}
                                <a href="mailto:support@docuforge.io" className="text-primary-600 hover:underline">support@docuforge.io</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
