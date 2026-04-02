import Link from 'next/link';
import { ArrowLeft, Sparkles, Shield, Zap, Users, FileText, CheckCircle2 } from 'lucide-react';

const milestones = [
    { year: '2023', title: 'DocuForge started', text: 'Built to make document workflows faster and cleaner for teams.' },
    { year: '2024', title: 'Core tools launched', text: 'Merge, split, convert, scan and edit workflows shipped with production focus.' },
    { year: '2026', title: 'Scaling for everyday work', text: 'Performance, reliability and usability became the center of the platform.' },
];

const values = [
    { icon: Shield, title: 'Reliable', text: 'Stable document handling with clean fallbacks and recovery paths.' },
    { icon: Zap, title: 'Fast', text: 'Optimized for quick uploads, conversions and downloads.' },
    { icon: Users, title: 'Human-first', text: 'Built to feel simple for individuals and teams alike.' },
];

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
                    <div className="absolute top-40 -left-20 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 py-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 pb-20 pt-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-gray-700 shadow-sm border border-gray-100">
                                <Sparkles className="w-4 h-4 text-cyan-600" /> About DocuForge
                            </div>
                            <h1 className="mt-6 text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                                Built to make document work feel effortless.
                            </h1>
                            <p className="mt-6 text-lg text-gray-600 max-w-2xl">
                                DocuForge is a focused PDF platform for people who need speed, clarity and dependable output. We designed it to keep daily document tasks simple without sacrificing power.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                                    <div className="text-2xl font-bold text-gray-900">99.9%</div>
                                    <div className="text-sm text-gray-500">workflow reliability</div>
                                </div>
                                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                                    <div className="text-2xl font-bold text-gray-900">All</div>
                                    <div className="text-sm text-gray-500">tools</div>
                                </div>
                                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                                    <div className="text-2xl font-bold text-gray-900">24/7</div>
                                    <div className="text-sm text-gray-500">available online</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="rounded-[2rem] bg-white p-6 shadow-2xl border border-gray-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-5 text-white h-40 flex flex-col justify-between">
                                        <CheckCircle2 className="w-7 h-7" />
                                        <div>
                                            <div className="text-sm opacity-80">Focused workflow</div>
                                            <div className="text-xl font-semibold">One platform, less friction</div>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white h-40 flex flex-col justify-between">
                                        <FileText className="w-7 h-7" />
                                        <div>
                                            <div className="text-sm opacity-80">Document pipeline</div>
                                            <div className="text-xl font-semibold">Convert, edit, download</div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 rounded-2xl bg-slate-50 p-5 border border-gray-100 flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-gray-500">Why people use it</div>
                                            <div className="text-lg font-semibold text-gray-900">Fast setup, clean results, fewer steps.</div>
                                        </div>
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
                                            <Zap className="w-8 h-8" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 pb-20">
                <div className="grid md:grid-cols-3 gap-6">
                    {values.map((value) => (
                        <div key={value.title} className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white mb-4">
                                <value.icon className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">{value.title}</h2>
                            <p className="mt-2 text-gray-600">{value.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 pb-24">
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="rounded-[2rem] bg-white p-8 border border-gray-100 shadow-sm">
                        <h2 className="text-2xl font-bold text-gray-900">Our timeline</h2>
                        <div className="mt-6 space-y-6">
                            {milestones.map((item) => (
                                <div key={item.year} className="flex gap-4">
                                    <div className="w-20 shrink-0 rounded-xl bg-slate-900 text-white text-sm font-semibold px-3 py-2 text-center">{item.year}</div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{item.title}</div>
                                        <p className="text-gray-600 mt-1">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-cyan-900 p-8 text-white shadow-lg">
                        <h2 className="text-2xl font-bold">What we optimize for</h2>
                        <ul className="mt-6 space-y-4 text-white/90">
                            <li>• Clear tools with fewer clicks</li>
                            <li>• Reliable file handling under load</li>
                            <li>• Professional output that feels polished</li>
                            <li>• Simple contact through email, not extra forms</li>
                        </ul>
                        <div className="mt-8">
                            <Link href="/integrations" className="inline-flex items-center rounded-full bg-white px-5 py-3 font-semibold text-slate-900">
                                Explore links and portfolio
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
