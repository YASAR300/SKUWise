"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadZone({ onUploadComplete }) {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error'
    const [dataType, setDataType] = useState("product"); // 'product', 'review', 'sales'

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        validateFiles(droppedFiles);
    }, []);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        validateFiles(selectedFiles);
    };

    const validateFiles = (newFiles) => {
        const allowedTypes = [
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ];

        const validFiles = newFiles.filter(file =>
            allowedTypes.includes(file.type) ||
            file.name.endsWith(".csv") ||
            file.name.endsWith(".xlsx") ||
            file.name.endsWith(".xls")
        );

        if (validFiles.length < newFiles.length) {
            setUploadStatus({ type: 'error', message: "Some files were rejected. Please use CSV or Excel formats." });
        }

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadStatus(null);

        const formData = new FormData();
        files.forEach(file => {
            formData.append("files", file);
        });
        formData.append("type", dataType);

        try {
            const response = await fetch("/api/ingest", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                setUploadStatus({ type: 'success', message: `${files.length} files processed successfully.` });
                setFiles([]);
                if (onUploadComplete) onUploadComplete(result);
            } else {
                throw new Error(result.error || "Upload failed");
            }
        } catch (error) {
            setUploadStatus({ type: 'error', message: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="flex justify-center gap-4 mb-2">
                {['product', 'review', 'sales'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setDataType(type)}
                        className={cn(
                            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                            dataType === type
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
                        )}
                    >
                        {type}s
                    </button>
                ))}
            </div>

            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    "relative group border-2 border-dashed rounded-3xl p-12 transition-all duration-300 flex flex-col items-center justify-center text-center",
                    isDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border hover:border-primary/50 hover:bg-secondary/30",
                    files.length > 0 && "py-8"
                )}
            >
                <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".csv,.xlsx,.xls"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                />

                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
                    <Upload className="h-8 w-8" />
                </div>

                <h3 className="text-xl font-black text-foreground mb-2">Drop your intelligence data</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto font-medium">
                    Drag and drop your CSV or Excel files here to feed the neural network.
                </p>

                {files.length > 0 && (
                    <div className="mt-8 w-full space-y-3">
                        <AnimatePresence>
                            {files.map((file, idx) => (
                                <motion.div
                                    key={`${file.name}-${idx}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-primary">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-foreground truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                        className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors text-muted-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4">
                <button
                    onClick={uploadFiles}
                    disabled={files.length === 0 || isUploading}
                    className={cn(
                        "w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-2 shadow-xl",
                        files.length > 0
                            ? "bg-primary text-white hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
                            : "bg-secondary text-muted-foreground cursor-not-allowed"
                    )}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Feed Engine
                            <ChevronRight className="h-4 w-4" />
                        </>
                    )}
                </button>

                <AnimatePresence>
                    {uploadStatus && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={cn(
                                "p-4 rounded-2xl border flex items-center gap-3",
                                uploadStatus.type === 'success'
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                            )}
                        >
                            {uploadStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            <p className="text-sm font-bold">{uploadStatus.message}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Helper icons missing in the snippet
import { ChevronRight } from "lucide-react";
