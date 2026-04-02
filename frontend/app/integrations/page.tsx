import Link from 'next/link';
import { ArrowLeft, Github, Linkedin, Globe, Mail, Sparkles, ExternalLink, FolderOpen } from 'lucide-react';

const links = [
    { title: 'Portfolio', href: 'https://umarcraft.vercel.app/', icon: Globe, text: 'See the portfolio website' },
    { title: 'LinkedIn', href: 'https://www.linkedin.com/in/umar-farooq57/', icon: Linkedin, text: 'Professional profile and updates' },
    { title: 'GitHub', href: 'https://github.com/umarfarooq57', icon: Github, text: 'Code, repositories and work history' },
    { title: 'Email', href: 'mailto:umarfarooq5743@gmail.com', icon: Mail, text: 'Direct contact by email only' },
];

export default function IntegrationsPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            <section className="max-w-7xl mx-auto px-4 py-8">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
            </section>

            <section className="max-w-7xl mx-auto px-4 pb-16">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-gray-100 text-sm text-gray-700">
                            <Sparkles className="w-4 h-4 text-indigo-600" /> Integrations & Links
                        </div>
                        <h1 className="mt-6 text-4xl md:text-6xl font-bold text-gray-900 leading-tight">Connect with the creator and explore the portfolio.</h1>
                        <p className="mt-6 text-lg text-gray-600 max-w-2xl">
                            This page replaces the old 404 with a professional contact hub. Use the links below to view work, code and direct email contact.
                        </p>
                    </div>
                    <div className="rounded-[2rem] bg-slate-900 text-white p-8 shadow-2xl border border-slate-800">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-white/10 p-5 border border-white/10 h-40 flex flex-col justify-between">
                                <FolderOpen className="w-7 h-7 text-cyan-300" />
                                <div>
                                    <div className="text-sm text-white/70">Portfolio view</div>
                                    <div className="text-xl font-semibold">Polished presence</div>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-5 h-40 flex flex-col justify-between">
                                <ExternalLink className="w-7 h-7" />
                                <div>
                                    <div className="text-sm opacity-80">External links</div>
                                    <div className="text-xl font-semibold">LinkedIn, GitHub, email</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 pb-24">
                <div className="grid md:grid-cols-2 gap-6">
                    {links.map((link) => (
                        <a
                            key={link.title}
                            href={link.href}
                            target={link.href.startsWith('mailto:') ? '_self' : '_blank'}
                            rel={link.href.startsWith('mailto:') ? undefined : 'noreferrer'}
                            className="group rounded-[1.75rem] bg-white p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center">
                                    <link.icon className="w-6 h-6" />
                                </div>
                                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
                            </div>
                            <h2 className="mt-5 text-2xl font-semibold text-gray-900">{link.title}</h2>
                            <p className="mt-2 text-gray-600">{link.text}</p>
                        </a>
                    ))}
                </div>
            </section>
        </main>
    );
}
