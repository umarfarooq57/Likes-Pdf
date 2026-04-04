import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle2, FileText, UploadCloud, Settings2, Loader2, Download } from 'lucide-react';

const steps = [
    {
        title: 'Step 1: Upload Your Word File',
        description:
            'Open the Word to PDF tool, then use the Upload File button to select a .doc or .docx file.',
        image: '/demo/steps/step-1-upload-word.svg',
        icon: UploadCloud,
    },
    {
        title: 'Step 2: Start the Conversion',
        description:
            'After selecting your file, click Convert to PDF to begin processing.',
        image: '/demo/steps/step-2-start-conversion.svg',
        icon: Settings2,
    },
    {
        title: 'Step 3: Monitor Processing Status',
        description:
            'Wait until the status changes to Completed. Larger documents may take longer to process.',
        image: '/demo/steps/step-3-processing.svg',
        icon: Loader2,
    },
    {
        title: 'Step 4: Download the Final PDF',
        description:
            'Once conversion is complete, click Download PDF to save the final file.',
        image: '/demo/steps/step-4-download-pdf.svg',
        icon: Download,
    },
];

export default function WordToPdfGuidePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-10 px-4">
            <div className="max-w-6xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-sm p-6 md:p-10 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Word to PDF Complete Guide</h1>
                            <p className="text-slate-600 mt-1">This page walks you through the full process with visual examples.</p>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {steps.map((step) => (
                            <article key={step.title} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                                <div className="relative aspect-video bg-slate-100">
                                    <Image src={step.image} alt={step.title} fill className="object-cover" />
                                </div>
                                <div className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                            <step.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-slate-900">{step.title}</h2>
                                            <p className="text-sm text-slate-600 mt-1 leading-6">{step.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-700 mt-0.5" />
                            <div>
                                <h3 className="text-emerald-900 font-semibold">Quick Tips</h3>
                                <ul className="text-sm text-emerald-800 mt-2 space-y-1">
                                    <li>For best results, use an editable .docx file.</li>
                                    <li>Keep the browser tab open until the conversion is complete.</li>
                                    <li>If conversion fails, upload the file again and retry.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/tools/word-to-pdf"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Open Word to PDF Tool
                        </Link>
                        <Link
                            href="/tools"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Browse All Tools
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
