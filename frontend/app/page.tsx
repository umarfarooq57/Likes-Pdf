import Link from 'next/link';
import {
    FileText,
    Merge,
    Split,
    RotateCw,
    Minimize2,
    FileImage,
    FileCode,
    Shield,
    Zap,
    ArrowRight,
    Lock,
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
    Download,
    Star,
    Play,
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
        name: 'Compress PDF',
        description: 'Reduce file size while maintaining quality',
        icon: Minimize2,
        href: '/tools/compress',
        color: 'from-orange-500 to-orange-600',
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
        name: 'Protect PDF',
        description: 'Add password protection and encryption',
        icon: Lock,
        href: '/tools/protect',
        color: 'from-red-500 to-red-600',
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
    {
        name: 'Watermark',
        description: 'Add text or image watermarks',
        icon: Droplets,
        href: '/tools/watermark',
        color: 'from-cyan-500 to-cyan-600',
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
        name: 'Security',
        description: 'Protect and secure documents',
        icon: Shield,
        tools: ['Password Protect', 'Unlock', 'Watermark', 'Digital Sign', 'Redact'],
        href: '/tools?category=security',
        color: 'from-red-500 to-red-600',
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
    { value: '70+', label: 'PDF Tools' },
];

const testimonials = [
    {
        quote: "DocuForge has transformed how our team handles documents. The AI features are incredible!",
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
                            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                                Pricing
                            </Link>
                            <Link href="/api-docs" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                                API
                            </Link>
                            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                                Login
                            </Link>
                            <Link href="/register" className="btn-primary">
                                Get Started Free
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
                                Merge, split, compress, convert, edit, and sign PDF files. All-in-one online platform
                                with enterprise-grade conversion engines and security.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href="/tools" className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-lg">
                                    Explore All Tools <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link href="/register" className="btn-secondary inline-flex items-center justify-center gap-2 px-8 py-4 text-lg">
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

                                <div className="absolute top-20 -right-10 w-64 p-4 bg-white rounded-xl shadow-xl border border-gray-100 transform rotate-6 hover:rotate-0 transition-transform">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                            <Minimize2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Compress</div>
                                            <div className="text-sm text-gray-500">Reduce 70% file size</div>
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
                            Everything you need to work with PDF documents. Fast, secure, and powered by AI.
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
                                    {tool.isNew && (
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
                            View All 70+ Tools <ArrowRight className="w-5 h-5" />
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
                            Over 70 tools organized by category. Find exactly what you need.
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
                        <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
                            Get Started Free <ArrowRight className="w-5 h-5" />
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
                                <a href="#" className="hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                                </a>
                                <a href="#" className="hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                </a>
                                <a href="#" className="hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/tools" className="hover:text-white transition-colors">All Tools</Link></li>
                                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                                <li><Link href="/api-docs" className="hover:text-white transition-colors">API</Link></li>
                                <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
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
