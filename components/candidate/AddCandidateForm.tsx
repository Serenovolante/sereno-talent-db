"use-client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X } from 'lucide-react';

export const AddCandidateForm = () => {
    const [file, setFile] = useState<File | null>(null);
    const [customNotes, setCustomNotes] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setError(null);
        setSuccess(null);
        if (acceptedFiles.length > 0) {
            const uploadedFile = acceptedFiles[0];
            // Basic validation for file type and size (e.g., 5MB limit)
            if (uploadedFile.size > 5 * 1024 * 1024) {
                setError("File is too large. Please upload a file smaller than 5MB.");
                return;
            }
            setFile(uploadedFile);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxFiles: 1,
        multiple: false,
    });

    const handleUpload = async () => {
        if (!file || isUploading) return;

        setIsUploading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('customNotes', customNotes);

        try {
            const response = await fetch('/api/candidates/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSuccess(`${result.candidateName} has been successfully added.`);
                setFile(null);
                setCustomNotes('');
            } else {
                setError(result.error || "Failed to parse the resume. Please try another file.");
            }
        } catch (err) {
            setError("An error occurred while processing the file. Please try again.");
            console.error("Upload error:", err);
        }

        setIsUploading(false);
    };

    const removeFile = () => {
        setFile(null);
        setError(null);
        setSuccess(null);
    };

    return (
        // The form now uses a simple grid layout with consistent spacing.
        <div className="space-y-6">
            
            {/* RESUME UPLOAD FIELD */}
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Resume File
                </label>
                <div
                    {...getRootProps()}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 
                        ${isDragActive 
                            ? 'border-gray-800 bg-slate-100' 
                            : 'border-gray-300 hover:border-gray-500'}`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center text-gray-500">
                        <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                        {isDragActive ? (
                            <p className="font-semibold text-gray-800">Drop the file here...</p>
                        ) : (
                            <p>
                                <span className="font-semibold text-gray-800">Click to upload</span> or drag and drop
                            </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">PDF or DOCX (Max 5MB)</p>
                    </div>
                </div>

                {/* FILE PREVIEW */}
                {file && !isUploading && (
                    <div className="mt-4 bg-slate-100 border border-gray-200 p-3 rounded-lg flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-800 truncate">{file.name}</span>
                        </div>
                        <button onClick={removeFile} className="p-1 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* CUSTOM NOTES FIELD */}
            <div>
                <label htmlFor="customNotes" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Custom Notes (Optional)
                </label>
                <textarea
                    id="customNotes"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={4}
                    className="block w-full rounded-md bg-slate-100 border-gray-300 shadow-sm focus:border-gray-800 focus:ring-2 focus:ring-gray-800/20 transition-shadow text-sm p-3"
                    placeholder="Add any internal notes about this candidate..."
                />
            </div>

            {/* MESSAGES */}
            <div className="h-5">
                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}
            </div>

            {/* ACTION BUTTON */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="inline-flex items-center cursor-pointer justify-center px-6 py-2.5 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-800 transition-colors"
                >
                    {isUploading ? 'Analyzing...' : 'Parse and Save Candidate'}
                </button>
            </div>
        </div>
    );
};