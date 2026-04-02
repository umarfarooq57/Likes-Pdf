import Link from 'next/link';
import {
    FileText,
    Merge,
    Split,
    RotateCw,
    FileImage,
    FileCode,
    Shield,
    Zap,
    ArrowRight,
    Scan,
    Brain,
    Camera,
    Languages,
    Sparkles,
    Unlock,
    Droplets,
    Scissors,
    Trash2,
    FileOutput,
    RefreshCw,
    Settings,
    PenTool,
    MessageSquare,
    CheckCircle,
    Globe,
    Users,
    Cloud,
    Star,
    Play,
    FileSpreadsheet,
    Linkedin,
    Github,
} from 'lucide-react';

// Featured tools - most popular
const featuredTools = [
    {
        name: 'Merge PDF',
        description: 'Combine multiple PDFs into a single document',
        icon: Merge,
        href: '/tools/merge',
        color: 'from-blue-500 to-blue-600',
        popular: true,
    },
    {
        name: 'Split PDF',
        description: 'Separate one PDF into multiple files',
        icon: Split,
        href: '/tools/split',
        color: 'from-green-500 to-green-600',
        popular: true,
    },
    {
        name: 'PDF to Word',
        description: 'Convert PDF to editable Word documents',
        icon: FileText,
        href: '/tools/pdf-to-word',
        color: 'from-indigo-500 to-indigo-600',
    },
    {
        name: 'PDF to Excel',
        description: 'Extract tables to Excel sheets',
        icon: FileSpreadsheet,
        href: '/tools/pdf-to-excel',
        color: 'from-emerald-500 to-emerald-600',
    },
    {
        name: 'PDF to CSV',
        description: 'Extract tabular data to CSV',
        icon: FileCode,
        href: '/tools/pdf-to-csv',
        color: 'from-gray-500 to-gray-600',
    },
];

// All tool categories
const toolCategories = [
    {
        name: 'Organize',
        description: 'Arrange and structure your PDFs',
        icon: Settings,
        tools: ['Merge', 'Split', 'Rotate', 'Delete Pages', 'Extract Pages', 'Reorder'],
        href: '/tools?category=organize',
        color: 'from-blue-500 to-blue-600',
    },
    {
        name: 'Convert',
        description: 'Transform between formats',
        icon: RefreshCw,
        tools: ['PDF to Word', 'PDF to Excel', 'PDF to Images', 'Images to PDF', 'HTML to PDF'],
        href: '/tools?category=convert',
        color: 'from-green-500 to-green-600',
    },
    {
        name: 'Edit & Annotate',
        description: 'Modify content and add notes',
        icon: PenTool,
        tools: ['Add Text', 'Highlight', 'Comments', 'Shapes', 'Redact'],
        href: '/tools?category=edit',
        color: 'from-purple-500 to-purple-600',
    },
    {
        name: 'Data & Formatting',
        description: 'Structured data and layout',
        icon: FileCode,
        tools: ['PDF to CSV', 'PDF to XML', 'PDF to JSON', 'CSV to PDF', 'JSON to PDF'],
        href: '/tools?category=data',
        color: 'from-gray-500 to-gray-600',
    },
];

const features = [
    {
        icon: Shield,
        title: 'Bank-Level Security',
        description: 'Your files are protected with AES-256 encryption. All uploads are automatically deleted after processing.',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Powered by advanced processing engines that deliver instant results, even for large documents.',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Powered by advanced processing engines that deliver instant results, even for large documents.',
    },
    {
        icon: Cloud,
        title: 'Cloud Integration',
        description: 'Connect with Google Drive, Dropbox, and OneDrive. Access your documents from anywhere.',
    },
    {
        icon: Users,
        title: 'Team Collaboration',
        description: 'Share documents, collaborate in real-time, and manage team permissions with ease.',
    },
    {
        icon: Globe,
        title: 'Works Everywhere',
        description: 'Access from any device, any browser. No installation required. Works on desktop and mobile.',
    },
];

const stats = [
    { value: '10M+', label: 'Documents Processed' },
    { value: '500K+', label: 'Happy Users' },
    { value: '99.9%', label: 'Uptime Guaranteed' },
    { value: 'All', label: 'Tools' },
];

const testimonials = [
    {
        quote: "DocuForge has transformed how our team handles documents. The features are incredible!",
        author: "Sarah Chen",
        role: "Product Manager at TechCorp",
        avatar: "SC",
    },
    {
        quote: "The fastest and most reliable PDF tool I've used. Essential for our daily operations.",
        author: "Michael Rodriguez",
        role: "Operations Director",
        avatar: "MR",
    },
    {
        quote: "Enterprise-grade security with consumer-grade simplicity. Perfect combination.",
        author: "Emily Watson",
        role: "IT Security Lead",
        avatar: "EW",
    },
];

export default function Home() {
    return (
        <main className="min-h-screen">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">DocuForge</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/tools" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                                All Tools
                            </Link>
                            <Link href="/tools" className="btn-primary">
                                Start Converting
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-slate-50 via-white to-purple-50 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-in text-center lg:text-left">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                Every tool you need to
                                <span className="gradient-text"> work with PDFs</span>
                            </h1>

                            <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                                Merge, split, convert, edit, and scan PDF files. All-in-one online platform
                                with enterprise-grade conversion engines and security.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href="/tools" className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-lg">
                                    Explore All Tools <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link href="/word-to-pdf-guide" className="btn-secondary inline-flex items-center justify-center gap-2 px-8 py-4 text-lg">
                                    <Play className="w-5 h-5" /> Watch Demo
                                </Link>
                            </div>

                            <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
                                <div className="flex -space-x-2">
                                    {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'].map((bg, i) => (
                                        <div key={i} className={`w-10 h-10 rounded-full ${bg} border-2 border-white flex items-center justify-center text-white text-sm font-medium`}>
                                            {['JD', 'SK', 'MR', 'AL'][i]}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600">Loved by 500K+ users</p>
                                </div>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="relative hidden lg:block">
                            <div className="relative">
                                {/* Floating cards */}
                                <div className="absolute -top-10 -left-10 w-64 p-4 bg-white rounded-xl shadow-xl border border-gray-100 transform -rotate-6 hover:rotate-0 transition-transform">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                            <Merge className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Merge PDF</div>
                                            <div className="text-sm text-gray-500">Combine files instantly</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-10 left-10 w-64 p-4 bg-white rounded-xl shadow-xl border border-gray-100 transform rotate-3 hover:rotate-0 transition-transform">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                                            <FileCode className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">PDF to CSV</div>
                                            <div className="text-sm text-gray-500">Extract tables instantly</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main visual */}
                                <div className="w-80 h-96 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl shadow-2xl flex items-center justify-center">
                                    <FileText className="w-32 h-32 text-white/90" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="py-8 px-4 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Tools */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Popular PDF Tools
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Everything you need to work with PDF documents. Fast, secure, and reliable.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredTools.map((tool) => (
                            <Link key={tool.name} href={tool.href}>
                                <div className="tool-card group h-full relative">
                                    {tool.popular && (
                                        <span className="absolute -top-2 -right-2 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                                            Popular
                                        </span>
                                    )}
                                    {(tool as any).isNew && (
                                        <span className="absolute -top-2 -right-2 px-2 py-1 bg-pink-500 text-white text-xs font-medium rounded-full">
                                            New
                                        </span>
                                    )}
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <tool.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {tool.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {tool.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link href="/tools" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary-500 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors">
                            View All Tools <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Tool Categories */}
            <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Complete PDF Toolkit
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            All tools organized by category. Find exactly what you need.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {toolCategories.map((category) => (
                            <Link key={category.name} href={category.href}>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                                        <category.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {category.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4">
                                        {category.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {category.tools.slice(0, 4).map((tool) => (
                                            <span key={tool} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                                {tool}
                                            </span>
                                        ))}
                                        {category.tools.length > 4 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                                                +{category.tools.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why Choose DocuForge?
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Built for professionals who demand the best
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <div key={feature.title} className="text-center p-6">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                                    <feature.icon className="w-8 h-8 text-primary-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Trusted by Teams Worldwide
                        </h2>
                        <p className="text-gray-600">
                            See what our users have to say
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-6">"{testimonial.quote}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{testimonial.author}</div>
                                        <div className="text-sm text-gray-500">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-primary-600 to-accent-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to transform your document workflow?
                    </h2>
                    <p className="text-white/80 text-lg mb-8">
                        Join over 500,000 professionals who trust DocuForge for their PDF needs.
                        Start free today, no credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/tools" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
                            Start Using Tools <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/tools" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/30">
                            Explore Tools
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-4 bg-gray-900 text-gray-400">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                        <div className="col-span-2">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-white text-xl font-bold">DocuForge</span>
                            </div>
                            <p className="text-sm mb-4">
                                The complete PDF platform for modern teams.
                                Edit, convert, and collaborate on documents with enterprise security.
                            </p>
                            <div className="flex gap-4">
                                <a href="https://www.linkedin.com/in/umar-farooq57/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-white transition-colors">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                                <a href="https://github.com/umarfarooq57" target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-white transition-colors">
                                    <Github className="w-5 h-5" />
                                </a>
                                <a href="https://umarcraft.vercel.app/" target="_blank" rel="noreferrer" aria-label="Portfolio" className="hover:text-white transition-colors">
                                    <Globe className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/tools" className="hover:text-white transition-colors">All Tools</Link></li>
                                <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                                <li><a href="mailto:umarfarooq5743@gmail.com" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
                                <li><Link href="/gdpr" className="hover:text-white transition-colors">GDPR</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm">© 2024 DocuForge. All rights reserved.</p>
                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                            <span className="text-sm">🔒 SOC 2 Certified</span>
                            <span className="text-sm">🛡️ GDPR Compliant</span>
                            <span className="text-sm">🏥 HIPAA Ready</span>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
