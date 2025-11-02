"use client";

import { Search } from 'lucide-react';

interface FindTalentFormProps {
    onSearch: (results: any[]) => void;
    isSearching: boolean;
}

export const FindTalentForm = ({ onSearch, isSearching }: FindTalentFormProps) => {

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Prevent submission if already searching
    if (isSearching) return;
    
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Basic validation: ensure at least one keyword field is filled
    if (!data.jd && !data.keywords) {
        alert("Please enter a Job Description or some Skills/Keywords to search.");
        return;
    }

    try {
      const response = await fetch('/api/candidates/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const results = await response.json();
      onSearch(results);
    } catch (error) {
      console.error('Search error:', error);
      onSearch([]); // Return empty array on error
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm" style={{ borderRadius: '12px' }}>
      <h2 className="text-2xl font-semibold text-slate-900">Analysis Parameters</h2>
      <p className="text-slate-600 mt-1">Find profiles by keywords, filters, or a full job description.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
            <label htmlFor="jd" className="block text-sm font-medium text-slate-700">
            Job Description (for context)
            </label>
            <div className="mt-1">
            <textarea
                id="jd"
                name="jd"
                rows={5}
                className="block w-full rounded-md border-slate-300 focus:border-slate-900 focus:ring-slate-900 sm:text-sm p-3 border"
                placeholder="e.g., A senior developer to lead our frontend team..."
                style={{ borderRadius: '8px' }}
            />
            </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* UPDATED FIELD: Location is now Keywords */}
            <div>
                <label htmlFor="keywords" className="block text-sm font-medium text-slate-700">
                    Skills / Keywords <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    name="keywords" 
                    id="keywords" 
                    placeholder="e.g., react, node, python" 
                    className="mt-1 block w-full rounded-md border-slate-300 focus:border-slate-900 focus:ring-slate-900 sm:text-sm p-3 border" 
                    style={{ borderRadius: '8px' }}
                    required // Making this field required for a more focused search
                />
            </div>

            {/* Unchanged Fields */}
            <div>
                <label htmlFor="experience" className="block text-sm font-medium text-slate-700">Min. Experience (Years)</label>
                <input type="number" name="experience" id="experience" placeholder="e.g., 5" className="mt-1 block w-full rounded-md border-slate-300 focus:border-slate-900 focus:ring-slate-900 sm:text-sm p-3 border" style={{ borderRadius: '8px' }} />
            </div>
            <div>
                <label htmlFor="workPreference" className="block text-sm font-medium text-slate-700">Work Preference</label>
                <select id="workPreference" name="workPreference" className="mt-1 block w-full rounded-md border-slate-300 focus:border-slate-900 focus:ring-slate-900 sm:text-sm p-3 border" style={{ borderRadius: '8px' }}>
                    <option>Any</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                </select>
            </div>
        </div>

        <div className="text-right">
            <button
            type="submit"
            disabled={isSearching}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
            style={{ borderRadius: '8px' }}
            >
            <Search className="w-4 h-4" />
            {isSearching ? 'Searching...' : 'Run Analysis'}
            </button>
        </div>
        </form>
    </div>
  );
};