'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand Logo */}
                    <Link href="/" className="flex items-center space-x-2.5 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                DocuForge
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link
                            href="/tools"
                            className="text-gray-600 hover:text-primary-600 font-medium transition-colors text-sm lg:text-base px-3 py-1.5 rounded-lg hover:bg-gray-50"
                        >
                            All Tools
                        </Link>
                        <Link
                            href="/tools/merge"
                            className="text-gray-600 hover:text-primary-600 font-medium transition-colors text-sm lg:text-base px-3 py-1.5 rounded-lg hover:bg-gray-50"
                        >
                            Merge PDF
                        </Link>
                        <Link
                            href="/tools/images-to-pdf"
                            className="text-gray-600 hover:text-primary-600 font-medium transition-colors text-sm lg:text-base px-3 py-1.5 rounded-lg hover:bg-gray-50"
                        >
                            Images to PDF
                        </Link>
                        <Link
                            href="/tools/compress"
                            className="text-gray-600 hover:text-primary-600 font-medium transition-colors text-sm lg:text-base px-3 py-1.5 rounded-lg hover:bg-gray-50"
                        >
                            Compress PDF
                        </Link>
                        <Link
                            href="/tools/word-to-pdf"
                            className="text-gray-600 hover:text-primary-600 font-medium transition-colors text-sm lg:text-base px-3 py-1.5 rounded-lg hover:bg-gray-50"
                        >
                            Word to PDF
                        </Link>
                        <Link
                            href="/tools"
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm"
                        >
                            <Sparkles className="w-4 h-4" /> Start Free
                        </Link>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2.5 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                            aria-label="Toggle navigation menu"
                            aria-expanded={mobileOpen}
                        >
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileOpen && (
                <div className="md:hidden border-b border-gray-100 bg-white/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-4 duration-200">
                    <Link
                        href="/tools"
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                        All Tools
                    </Link>
                    <Link
                        href="/tools/merge"
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                        Merge PDF
                    </Link>
                    <Link
                        href="/tools/images-to-pdf"
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                        Images to PDF
                    </Link>
                    <Link
                        href="/tools/split"
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                        Split PDF
                    </Link>
                    <Link
                        href="/tools/compress"
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                        Compress PDF
                    </Link>
                    <Link
                        href="/tools/word-to-pdf"
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                        Word to PDF
                    </Link>
                    <div className="pt-2">
                        <Link
                            href="/tools"
                            onClick={() => setMobileOpen(false)}
                            className="w-full text-center flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-md"
                        >
                            <Sparkles className="w-4 h-4" /> Start Free
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
