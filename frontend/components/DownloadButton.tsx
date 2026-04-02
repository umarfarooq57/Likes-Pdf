"use client";

import React from 'react';

interface Props {
    url: string;
    fallbackName?: string;
    className?: string;
    children?: React.ReactNode;
}

export default function DownloadButton({ url, fallbackName, className, children }: Props) {
    const handleClick = async () => {
        try {
            const api = await import('@/lib/api');
            const { blob, filename } = await api.documentsApi.downloadBlobUrl(url);
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename || fallbackName || 'download';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            // fallback: open in new tab
            window.open(url, '_blank');
        }
    };

    return (
        <button onClick={handleClick} className={className}>
            {children}
        </button>
    );
}
