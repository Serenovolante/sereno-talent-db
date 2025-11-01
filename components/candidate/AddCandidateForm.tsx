"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X } from 'lucide-react';

export const AddCandidateForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setSuccess(null);
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
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
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/candidates/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`${result.candidateName} has been successfully added.`);
        setFile(null);
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
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Upload Resume</h2>
            <p className="text-gray-600 mt-1">Add a new candidate by uploading their resume file.</p>
            <div
                {...getRootProps()}
                className={`mt-6 border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                    <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                    {isDragActive ? (
                        <p className="text-blue-600 font-semibold">Drop the file here ...</p>
                    ) : (
                        <p className="text-gray-500">
                        <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                        </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">PDF or DOCX</p>
                </div>
            </div>

            {file && !isUploading && (
                <div className="mt-6 bg-gray-100 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">{file.name}</span>
                    </div>
                    <button onClick={removeFile} className="text-gray-500 hover:text-red-600"><X className="w-5 h-5" /></button>
                </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-4 text-sm text-green-600">{success}</p>}

            <div className="mt-8 text-right">
                <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                {isUploading ? 'Analyzing...' : 'Parse and Save Candidate'}
                </button>
            </div>
        </div>
    </div>
  );
};