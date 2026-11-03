import Link from 'next/link';
import { ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function GDPRPage() {
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
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">GDPR Compliance</h1>
                            <p className="text-sm text-gray-500">European Data Protection Standards</p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-6 text-gray-600">
                        <p>
                            DocuForge complies with the General Data Protection Regulation (GDPR) (EU) 2016/679. We respect individual privacy rights and protect European citizen data.
                        </p>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-gray-900">Your GDPR Rights</h2>
                            <ul className="space-y-2.5">
                                {[
                                    'Right to be forgotten: request immediate permanent erasure of any uploaded data.',
                                    'Right of access: review all information processed on your behalf.',
                                    'Right to restriction: limit data processing for certain workflows.',
                                    'Right to data portability: download and transfer your original or processed files.'
                                ].map((right, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span>{right}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-gray-900">Data Protection Officer</h2>
                            <p>
                                To exercise your GDPR rights or submit data inquiries, email our privacy team at{' '}
                                <a href="mailto:dpo@docuforge.io" className="text-primary-600 hover:underline">dpo@docuforge.io</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
