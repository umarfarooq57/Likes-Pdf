'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { documentsApi } from '@/lib/api';

interface UploadedFile {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
    documentId?: string;
}

interface FileDropzoneProps {
    accept?: Record<string, string[]>;
    acceptedTypes?: string[];  // Simple array like ['application/pdf', 'image/*']
    maxFiles?: number;
    maxSize?: number;
    onFilesSelected?: (files: File[]) => void;
    onFileUploaded?: (documentId: string, file: File) => void;
    multiple?: boolean;
    uploadImmediately?: boolean;
}

const defaultAccept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
};

// Helper to convert simple types to accept format
const convertAcceptedTypes = (types: string[]): Record<string, string[]> => {
    const result: Record<string, string[]> = {};
    types.forEach(type => {
        if (type === 'application/pdf') {
            result['application/pdf'] = ['.pdf'];
        } else if (type === 'image/*') {
            result['image/*'] = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'];
        } else if (type === '*' || type === '*/*') {
            return defaultAccept;
        } else {
            result[type] = [];
        }
    });
    return Object.keys(result).length > 0 ? result : defaultAccept;
};

export default function FileDropzone({
    accept,
    acceptedTypes,
    maxFiles = 10,
    maxSize = 100 * 1024 * 1024, // 100MB
    onFilesSelected,
    onFileUploaded,
    multiple = true,
    uploadImmediately = false,
}: FileDropzoneProps) {
    const [files, setFiles] = useState<UploadedFile[]>([]);

    // Determine accept value - prefer accept prop, then convert acceptedTypes, fallback to default
    const finalAccept = accept || (acceptedTypes ? convertAcceptedTypes(acceptedTypes) : defaultAccept);

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
            // Handle accepted files
            const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                progress: 0,
                status: uploadImmediately ? 'uploading' : 'completed',
            }));

            setFiles((prev) => [...prev, ...newFiles]);

            if (onFilesSelected) {
                onFilesSelected(acceptedFiles);
            }

            // Upload immediately if enabled
            if (uploadImmediately) {
                if (newFiles.length > 1) {
                    uploadFilesBatch(newFiles);
                } else {
                    uploadFile(newFiles[0]);
                }
            }
        },
        [onFilesSelected, uploadImmediately]
    );

    const uploadFile = async (uploadedFile: UploadedFile) => {
        try {
            // Real API upload with progress tracking
            const response = await documentsApi.upload(uploadedFile.file, (progress) => {
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === uploadedFile.id ? { ...f, progress } : f
                    )
                );
            });

            // Mark as completed with real document ID from backend
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadedFile.id
                        ? { ...f, status: 'completed', progress: 100, documentId: response.id }
                        : f
                )
            );

            if (onFileUploaded) {
                if (response.id) {
                    onFileUploaded(response.id, uploadedFile.file);
                }
            }
        } catch (error: any) {
            // Mark as error
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadedFile.id
                        ? {
                            ...f,
                            status: 'error',
                            error: error.response?.data?.detail || 'Upload failed'
                        }
                        : f
                )
            );
        }
    };

    const uploadFilesBatch = async (uploadedFiles: UploadedFile[]) => {
        try {
            const filesToUpload = uploadedFiles.map((item) => item.file);
            const response = await documentsApi.uploadBatch(filesToUpload, (progress) => {
                setFiles((prev) =>
                    prev.map((f) =>
                        uploadedFiles.some((u) => u.id === f.id)
                            ? { ...f, progress }
                            : f
                    )
                );
            });

            const uploaded = Array.isArray(response?.files) ? response.files : [];

            setFiles((prev) =>
                prev.map((f) => {
                    const fileIndex = uploadedFiles.findIndex((u) => u.id === f.id);
                    if (fileIndex === -1) {
                        return f;
                    }

                    const result = uploaded[fileIndex] || {};
                    const id = result.id || result.file_id || result.fileId;
                    if (result.error || !id) {
                        return {
                            ...f,
                            status: 'error',
                            error: result.error || 'Upload failed',
                        };
                    }

                    if (onFileUploaded) {
                        onFileUploaded(String(id), f.file);
                    }

                    return {
                        ...f,
                        status: 'completed',
                        progress: 100,
                        documentId: String(id),
                    };
                })
            );
        } catch (error: any) {
            setFiles((prev) =>
                prev.map((f) =>
                    uploadedFiles.some((u) => u.id === f.id)
                        ? {
                            ...f,
                            status: 'error',
                            error: error.response?.data?.detail || 'Batch upload failed',
                        }
                        : f
                )
            );
        }
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: finalAccept,
        maxFiles,
        maxSize,
        multiple,
    });

    return (
        <div className="w-full">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={clsx(
                    'dropzone group',
                    isDragActive && 'dropzone-active'
                )}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center">
                    <div className={clsx(
                        'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
                        isDragActive
                            ? 'bg-primary-500 scale-110'
                            : 'bg-gray-100 group-hover:bg-primary-100'
                    )}>
                        <Upload className={clsx(
                            'w-8 h-8 transition-colors',
                            isDragActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-500'
                        )} />
                    </div>

                    {isDragActive ? (
                        <p className="text-primary-600 font-medium">Drop files here...</p>
                    ) : (
                        <>
                            <p className="text-gray-700 font-medium mb-1">
                                Drag & drop files here, or click to select
                            </p>
                            <p className="text-gray-400 text-sm">
                                Supports PDF, Word, Excel, PowerPoint, and images up to 100MB
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* File List */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 space-y-3"
                    >
                        {files.map((file) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-primary-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {file.file.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>

                                    {file.status === 'uploading' && (
                                        <div className="progress-bar mt-2">
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${file.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {file.status === 'completed' && (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                )}

                                {file.status === 'error' && (
                                    <span title={file.error}>
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    </span>
                                )}

                                <button
                                    onClick={() => removeFile(file.id)}
                                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
