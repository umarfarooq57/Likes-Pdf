"use client";

import React, { useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeDownloadUrl } from '@/lib/api';

interface Props {
    url: string;
    fallbackName?: string;
    className?: string;
    children?: React.ReactNode;
}

export default function DownloadButton({ url, fallbackName, className, children }: Props) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleClick = async () => {
        if (!url || isDownloading) return;
        setIsDownloading(true);

        try {
            const targetUrl = normalizeDownloadUrl(url);
            const downloadName = fallbackName || 'download.pdf';

            toast.success('Download started');

            // Trigger instant native browser download stream
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = targetUrl;
            a.setAttribute('download', downloadName);
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                try {
                    document.body.removeChild(a);
                } catch {}
                setIsDownloading(false);
            }, 1200);
        } catch (err) {
            // Fallback: direct window location trigger
            try {
                window.location.href = normalizeDownloadUrl(url);
            } catch {
                window.open(url, '_blank');
            }
            setIsDownloading(false);
        }
    };

    const defaultClass =
        "inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-base disabled:opacity-60";

    return (
        <button
            onClick={handleClick}
            className={className || defaultClass}
            disabled={isDownloading}
        >
            {isDownloading ? (
                <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Downloading...
                </span>
            ) : children ? (
                children
            ) : (
                <span className="inline-flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Download File
                </span>
            )}
        </button>
    );
}
