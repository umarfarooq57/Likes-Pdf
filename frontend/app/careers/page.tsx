import Link from 'next/link';
import { ArrowLeft, Briefcase, Rocket, HeartHandshake, CheckCircle2, MapPin, Mail } from 'lucide-react';

const roles = [
    { title: 'Frontend Designer', type: 'Remote', text: 'Build polished, responsive marketing and tool pages with strong visual systems.' },
    { title: 'Full Stack Engineer', type: 'Remote', text: 'Improve document workflows, reliability, and system speed across the stack.' },
    { title: 'Product Support', type: 'Part-time', text: 'Help users get value quickly with practical, clear guidance.' },
];

const perks = [
    'Clear ownership and straightforward communication',
    'Focus on shipping useful improvements',
    'Flexible work with measurable impact',
    'Priority on quality and reliability',
];

export default function CareersPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50">
            <section className="max-w-7xl mx-auto px-4 py-8">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
            </section>

            <section className="max-w-7xl mx-auto px-4 pb-16">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-gray-700 shadow-sm border border-gray-100">
                            <Briefcase className="w-4 h-4 text-rose-600" /> Careers
                        </div>
                        <h1 className="mt-6 text-4xl md:text-6xl font-bold text-gray-900 leading-tight">Build a product people use every day.</h1>
                        <p className="mt-6 text-lg text-gray-600 max-w-2xl">
                            We value calm execution, clean interfaces and practical features that solve real document work.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-700">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-gray-100 shadow-sm"><MapPin className="w-4 h-4" /> Remote-first</span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-gray-100 shadow-sm"><Rocket className="w-4 h-4" /> Fast shipping</span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-gray-100 shadow-sm"><HeartHandshake className="w-4 h-4" /> Collaborative</span>
                        </div>
                    </div>
                    <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-white/10 p-5 border border-white/10">
                                <CheckCircle2 className="w-7 h-7 text-emerald-300" />
                                <div className="mt-4 text-xl font-semibold">Simple workflows</div>
                                <div className="mt-1 text-white/70">Less friction, better results.</div>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-5 border border-white/10">
                                <Mail className="w-7 h-7 text-cyan-300" />
                                <div className="mt-4 text-xl font-semibold">Direct contact</div>
                                <div className="mt-1 text-white/70">Email only, no extra form.</div>
                            </div>
                        </div>
                        <div className="mt-6 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 p-5">
                            <div className="text-sm uppercase tracking-[0.25em] opacity-80">Join the mission</div>
                            <div className="mt-2 text-2xl font-semibold">Make document tools feel premium and fast.</div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 pb-10">
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="rounded-[2rem] bg-white p-8 border border-gray-100 shadow-sm">
                        <h2 className="text-2xl font-bold text-gray-900">Open roles</h2>
                        <div className="mt-6 space-y-4">
                            {roles.map((role) => (
                                <div key={role.title} className="rounded-2xl border border-gray-100 p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="font-semibold text-gray-900">{role.title}</div>
                                        <span className="rounded-full bg-rose-50 px-3 py-1 text-sm text-rose-700">{role.type}</span>
                                    </div>
                                    <p className="mt-2 text-gray-600">{role.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[2rem] bg-gradient-to-br from-rose-600 to-slate-900 p-8 text-white shadow-lg">
                        <h2 className="text-2xl font-bold">What we expect</h2>
                        <ul className="mt-6 space-y-3 text-white/90">
                            {perks.map((perk) => (
                                <li key={perk}>• {perk}</li>
                            ))}
                        </ul>
                        <div className="mt-8 rounded-2xl bg-white/10 p-5 border border-white/10">
                            <div className="text-sm uppercase tracking-[0.2em] opacity-70">Apply by email</div>
                            <div className="mt-2 text-lg font-semibold">umarfarooq5743@gmail.com</div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
