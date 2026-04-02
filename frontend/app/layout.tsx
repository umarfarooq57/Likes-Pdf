import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    ),

    title: 'DocuForge - Enterprise PDF Platform',
    description: 'Professional PDF processing platform. Convert, edit, and scan your documents online.',
    keywords: 'PDF converter, PDF editor, merge PDF, split PDF, document scanner, document processing',

    openGraph: {
        title: 'DocuForge - Enterprise PDF Platform',
        description: 'Professional PDF processing and document tools',
        type: 'website',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                            borderRadius: '12px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#10B981',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#EF4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
                {children}
            </body>
        </html>
    );
}
