import Link from 'next/link';
import {
    FileText,
    Merge,
    Split,
    RotateCw,
    Minimize2,
    FileImage,
    FileCode,
    Trash2,
    FileOutput,
    Image,
    FileSpreadsheet,
    Presentation,
    ArrowLeft,
    Lock,
    Unlock,
    Droplets,
    Hash,
    Info,
    Scan,
    Brain,
    MessageSquare,
    Tag,
    Search,
    Camera,
    Receipt,
    CreditCard,
    FileSearch,
    GripVertical,
    Edit3,
    PenTool,
    Crop,
    Wrench,
    GitCompare,
    AlignLeft,
    EyeOff,
    Bookmark,
    Layers,
    FolderOpen,
} from 'lucide-react';

const tools = [
    // Editing
    {
        category: 'Editing',
        items: [
            { name: 'Merge PDF', description: 'Combine multiple PDFs', icon: Merge, href: '/tools/merge', color: 'from-blue-500 to-blue-600' },
            { name: 'Split PDF', description: 'Split PDF into parts', icon: Split, href: '/tools/split', color: 'from-green-500 to-green-600' },
            { name: 'Rotate Pages', description: 'Rotate PDF pages', icon: RotateCw, href: '/tools/rotate', color: 'from-purple-500 to-purple-600' },
            { name: 'Delete Pages', description: 'Remove pages from PDF', icon: Trash2, href: '/tools/delete-pages', color: 'from-red-500 to-red-600' },
            { name: 'Extract Pages', description: 'Extract specific pages', icon: FileOutput, href: '/tools/extract-pages', color: 'from-indigo-500 to-indigo-600' },
            { name: 'Reorder Pages', description: 'Drag & drop to reorder', icon: GripVertical, href: '/tools/reorder', color: 'from-cyan-500 to-cyan-600' },
            { name: 'PDF Editor', description: 'Edit text and add annotations', icon: Edit3, href: '/tools/edit', color: 'from-violet-500 to-violet-600' },
            { name: 'Crop PDF', description: 'Crop page margins', icon: Crop, href: '/tools/crop', color: 'from-amber-500 to-amber-600' },
        ],
    },
    // Conversion
    {
        category: 'Conversion',
        items: [
            { name: 'PDF to Images', description: 'Convert to JPG/PNG', icon: Image, href: '/tools/pdf-to-images', color: 'from-pink-500 to-pink-600' },
            { name: 'Images to PDF', description: 'Create PDF from images', icon: FileImage, href: '/tools/images-to-pdf', color: 'from-teal-500 to-teal-600' },
            { name: 'Word to PDF', description: 'Convert DOCX to PDF', icon: FileText, href: '/tools/word-to-pdf', color: 'from-blue-600 to-blue-700' },
            { name: 'Excel to PDF', description: 'Convert XLSX to PDF', icon: FileSpreadsheet, href: '/tools/excel-to-pdf', color: 'from-green-600 to-green-700' },
            { name: 'PowerPoint to PDF', description: 'Convert PPTX to PDF', icon: Presentation, href: '/tools/ppt-to-pdf', color: 'from-orange-600 to-orange-700' },
            { name: 'HTML to PDF', description: 'Convert webpage to PDF', icon: FileCode, href: '/tools/html-to-pdf', color: 'from-cyan-500 to-cyan-600' },
            { name: 'PDF to Excel', description: 'Extract tables to Excel', icon: FileSpreadsheet, href: '/tools/pdf-to-excel', color: 'from-emerald-500 to-emerald-600' },
            { name: 'PDF to Text', description: 'Extract plain text', icon: AlignLeft, href: '/tools/pdf-to-text', color: 'from-gray-600 to-gray-700' },
            { name: 'PDF to CSV', description: 'Extract tables to CSV', icon: FileCode, href: '/tools/pdf-to-csv', color: 'from-gray-500 to-gray-600' },
            { name: 'PDF to XML', description: 'Convert to XML format', icon: FileCode, href: '/tools/pdf-to-xml', color: 'from-slate-500 to-slate-600' },
            { name: 'PDF to JSON', description: 'Convert to JSON data', icon: FileCode, href: '/tools/pdf-to-json', color: 'from-zinc-500 to-zinc-600' },
            { name: 'Batch Convert', description: 'Convert multiple files', icon: FolderOpen, href: '/tools/batch', color: 'from-violet-500 to-violet-600' },
        ],
    },
    // Data & Reporting
    {
        category: 'Data & Reporting',
        items: [
            { name: 'CSV to PDF', description: 'Generate PDF from CSV', icon: FileSpreadsheet, href: '/tools/csv-to-pdf', color: 'from-emerald-500 to-emerald-600' },
            { name: 'JSON to PDF', description: 'Generate PDF from JSON', icon: FileCode, href: '/tools/json-to-pdf', color: 'from-blue-500 to-blue-600' },
        ],
    },
    // Security & Signing
    {
        category: 'Security & Signing',
        items: [
            { name: 'Protect PDF', description: 'Add password protection', icon: Lock, href: '/tools/protect', color: 'from-red-500 to-red-600' },
            { name: 'Unlock PDF', description: 'Remove password', icon: Unlock, href: '/tools/unlock', color: 'from-green-500 to-green-600' },
            { name: 'Add Watermark', description: 'Add text or image watermark', icon: Droplets, href: '/tools/watermark', color: 'from-blue-500 to-blue-600' },
            { name: 'E-Sign PDF', description: 'Add your signature', icon: PenTool, href: '/tools/sign', color: 'from-indigo-500 to-indigo-600' },
            { name: 'Redact PDF', description: 'Permanently remove content', icon: EyeOff, href: '/tools/redact', color: 'from-rose-500 to-rose-600' },
            { name: 'Page Numbers', description: 'Add page numbering', icon: Hash, href: '/tools/page-numbers', color: 'from-purple-500 to-purple-600' },
            { name: 'Edit Metadata', description: 'Edit document properties', icon: Info, href: '/tools/metadata', color: 'from-gray-500 to-gray-600' },
        ],
    },
    // Optimization & Repair
    {
        category: 'Optimization & Repair',
        items: [
            { name: 'Compress PDF', description: 'Reduce file size', icon: Minimize2, href: '/tools/compress', color: 'from-orange-500 to-orange-600' },
            { name: 'Repair PDF', description: 'Fix corrupted files', icon: Wrench, href: '/tools/repair', color: 'from-yellow-500 to-yellow-600' },
            { name: 'Flatten PDF', description: 'Flatten forms & layers', icon: Layers, href: '/tools/flatten', color: 'from-indigo-500 to-indigo-600' },
            { name: 'Add Bookmarks', description: 'Create table of contents', icon: Bookmark, href: '/tools/bookmarks', color: 'from-amber-500 to-amber-600' },
            { name: 'Compare PDFs', description: 'Find differences', icon: GitCompare, href: '/tools/compare', color: 'from-cyan-500 to-cyan-600' },
        ],
    },
];

export default function ToolsPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">DocuForge</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                                Login
                            </Link>
                            <Link href="/register" className="btn-primary">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        All PDF Tools
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Everything you need to work with PDF documents. Select a tool to get started.
                    </p>
                </div>

                {/* Tools by Category */}
                {tools.map((category) => (
                    <div key={category.category} className="mb-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {category.category}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {category.items.map((tool) => (
                                <Link key={tool.name} href={tool.href}>
                                    <div className="tool-card group h-full">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                            <tool.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {tool.name}
                                        </h3>
                                        <p className="text-gray-600">
                                            {tool.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
