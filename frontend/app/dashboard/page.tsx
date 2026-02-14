'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    FileText,
    LogOut,
    Merge,
    Split,
    Minimize2,
    Clock,
    HardDrive,
    ArrowRight,
} from 'lucide-react';
import { authApi, documentsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    full_name?: string;
    storage_used: string;
    conversions_today: string;
}

interface Document {
    id: string;
    original_name: string;
    file_size: number;
    created_at: string;
}

const quickTools = [
    { name: 'Merge PDF', icon: Merge, href: '/tools/merge', color: 'from-blue-500 to-blue-600' },
    { name: 'Split PDF', icon: Split, href: '/tools/split', color: 'from-green-500 to-green-600' },
    { name: 'Compress PDF', icon: Minimize2, href: '/tools/compress', color: 'from-orange-500 to-orange-600' },
];

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [userData, docsData] = await Promise.all([
                authApi.getProfile(),
                documentsApi.list(1, 5),
            ]);
            setUser(userData);
            setDocuments(docsData.documents);
        } catch (error) {
            toast.error('Please log in to continue');
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        authApi.logout();
        router.push('/');
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">DocuForge</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <span className="text-gray-600">{user?.email}</span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome back{user?.full_name ? `, ${user.full_name}` : ''}!
                    </h1>
                    <p className="text-gray-500 mt-1">Here's what's happening with your documents</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{user?.conversions_today || '0'}</p>
                            <p className="text-gray-500 text-sm">Conversions Today</p>
                        </div>
                    </div>

                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <HardDrive className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{user?.storage_used || '0'} MB</p>
                            <p className="text-gray-500 text-sm">Storage Used</p>
                        </div>
                    </div>

                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                            <p className="text-gray-500 text-sm">Recent Documents</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Quick Tools */}
                    <div className="lg:col-span-1">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Tools</h2>
                        <div className="space-y-3">
                            {quickTools.map((tool) => (
                                <Link key={tool.name} href={tool.href}>
                                    <div className="card card-hover flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                                            <tool.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-medium text-gray-900">{tool.name}</span>
                                        <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <Link href="/tools" className="block mt-4 text-center text-primary-600 font-medium hover:text-primary-700">
                            View All Tools
                        </Link>
                    </div>

                    {/* Recent Documents */}
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Documents</h2>
                        <div className="card">
                            {documents.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{doc.original_name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {formatSize(doc.file_size)} • {formatDate(doc.created_at)}
                                                </p>
                                            </div>
                                            <a
                                                href={documentsApi.download(doc.id)}
                                                className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg"
                                            >
                                                Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No documents yet</p>
                                    <Link href="/tools" className="inline-block mt-4 text-primary-600 font-medium">
                                        Start using tools
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
