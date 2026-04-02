import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock3, Sparkles, PenTool, FileText, Users } from 'lucide-react';

const posts = [
    {
        title: 'Why fast PDF workflows matter in real teams',
        excerpt: 'A practical look at reducing document friction without adding complexity.',
        date: 'Apr 2026',
        readTime: '4 min read',
        tag: 'Product',
    },
    {
        title: 'A cleaner approach to file conversion reliability',
        excerpt: 'How fallback logic and queue-based processing improve the user experience.',
        date: 'Mar 2026',
        readTime: '6 min read',
        tag: 'Engineering',
    },
    {
        title: 'Designing a document platform that feels premium',
        excerpt: 'Visual structure, spacing and feedback make tools feel trustworthy.',
        date: 'Feb 2026',
        readTime: '5 min read',
        tag: 'Design',
    },
];

export default function BlogPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-emerald-50">
            <section className="max-w-7xl mx-auto px-4 py-8">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
            </section>

            <section className="max-w-7xl mx-auto px-4 pb-16">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-gray-100 text-sm text-gray-700">
                            <Sparkles className="w-4 h-4 text-emerald-600" /> Blog
                        </div>
                        <h1 className="mt-6 text-4xl md:text-6xl font-bold text-gray-900 leading-tight">Notes on building fast, clear document tools.</h1>
                        <p className="mt-6 text-lg text-gray-600 max-w-2xl">
                            Short posts about product decisions, engineering choices and practical document workflows.
                        </p>
                    </div>
                    <div className="rounded-[2rem] overflow-hidden shadow-2xl bg-white border border-gray-100">
                        <div className="h-64 bg-gradient-to-br from-emerald-500 via-cyan-500 to-slate-900 flex items-end p-8 text-white">
                            <div>
                                <div className="text-sm uppercase tracking-[0.3em] opacity-80">Editorial</div>
                                <div className="mt-2 text-3xl font-semibold">Built for clarity</div>
                                <div className="mt-2 text-white/80">Thoughtful product and engineering stories.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 pb-24">
                <div className="grid md:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <article key={post.title} className="rounded-[1.75rem] bg-white p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 font-medium">{post.tag}</span>
                                <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {post.date}</span>
                            </div>
                            <h2 className="mt-4 text-2xl font-semibold text-gray-900">{post.title}</h2>
                            <p className="mt-3 text-gray-600">{post.excerpt}</p>
                            <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                                <span className="inline-flex items-center gap-1"><Clock3 className="w-4 h-4" /> {post.readTime}</span>
                                <span className="inline-flex items-center gap-1 text-gray-900 font-medium">Read more <ArrowLeft className="w-4 h-4 rotate-180" /></span>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="mt-10 rounded-[2rem] bg-slate-900 text-white p-8 md:p-10 grid md:grid-cols-3 gap-6">
                    <div>
                        <PenTool className="w-8 h-8 text-emerald-300" />
                        <h3 className="mt-4 text-xl font-semibold">Product notes</h3>
                        <p className="mt-2 text-white/75">Simple decisions that keep the UI fast and understandable.</p>
                    </div>
                    <div>
                        <FileText className="w-8 h-8 text-cyan-300" />
                        <h3 className="mt-4 text-xl font-semibold">Engineering updates</h3>
                        <p className="mt-2 text-white/75">Conversion reliability, queue processing and performance work.</p>
                    </div>
                    <div>
                        <Users className="w-8 h-8 text-sky-300" />
                        <h3 className="mt-4 text-xl font-semibold">Team thinking</h3>
                        <p className="mt-2 text-white/75">What users need from a professional document platform.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
