"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';

interface FindTalentFormProps {
    onSearch: (results: any[]) => void;
    isSearching: boolean;
}

export const FindTalentForm = ({ onSearch, isSearching }: FindTalentFormProps) => {
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSearching) return;

        setError(null);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        // A more user-friendly validation check
        if (!data.jd && !data.keywords) {
            setError("Please provide a Job Description or some Skills/Keywords to start the analysis.");
            return;
        }

        // The API call logic remains the same
        try {
            const response = await fetch('/api/candidates/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Search request failed');
            }

            const results = await response.json();
            onSearch(results);
        } catch (error) {
            console.error('Search error:', error);
            setError('An unexpected error occurred during the search.');
            onSearch([]); // Return empty array on error
        }
    };

    return (
        // The form no longer has its own card, allowing it to fit into the parent container.
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* JOB DESCRIPTION */}
            <div>
                <label htmlFor="jd" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Job Description (Optional)
                </label>
                <textarea
                    id="jd"
                    name="jd"
                    rows={5}
                    className="block w-full rounded-md border-gray-300 bg-slate-100 shadow-sm focus:border-gray-800 focus:ring-2 focus:ring-gray-800/20 transition-shadow text-sm p-3"
                    placeholder="Provide a full job description for a context-aware search..."
                />
            </div>

            {/* FILTER FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label htmlFor="keywords" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Skills / Keywords <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="keywords"
                        id="keywords"
                        placeholder="e.g., react, node, python"
                        className="block w-full rounded-md border-gray-300 bg-slate-100   shadow-sm focus:border-gray-800 focus:ring-2 focus:ring-gray-800/20 transition-shadow text-sm p-3"
                    />
                </div>

                <div>
                    <label htmlFor="experience" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Min. Experience (Years)
                    </label>
                    <input
                        type="number"
                        name="experience"
                        id="experience"
                        placeholder="e.g., 5"
                        className="block w-full rounded-md border-gray-300 bg-slate-100 shadow-sm focus:border-gray-800 focus:ring-2 focus:ring-gray-800/20 transition-shadow text-sm p-3"
                    />
                </div>

                <div>
                    <label htmlFor="workPreference" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Work Preference
                    </label>
                    <select
                        id="workPreference"
                        name="workPreference"
                        className="block w-full rounded-md border-gray-300  bg-slate-100 shadow-sm focus:border-gray-800 focus:ring-2 focus:ring-gray-800/20 transition-shadow text-sm p-3"
                    >
                        <option>Any</option>
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                    </select>
                </div>
            </div>

            {/* ERROR MESSAGE & SUBMIT BUTTON */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                {/* Inline error message for better UX */}
                <div className="h-5">
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isSearching}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-800 transition-colors"
                >
                    <Search className="w-4 h-4" />
                    {isSearching ? 'Searching...' : 'Run Analysis'}
                </button>
            </div>
        </form>
    );
};