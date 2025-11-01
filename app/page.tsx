"use client";

import { useState } from 'react';
import { AddCandidateForm } from '@/components/candidate/AddCandidateForm';
import { FindTalentForm } from '@/components/candidate/FindTalentSection';
import { CandidateCard } from '@/components/candidate/CandidateCard';

type Tab = 'add' | 'find';

// Define a comprehensive Candidate interface that includes AI fields
export interface Candidate {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  skills: string[];
  totalExperience?: number;
  workPreference?: string;
  customNotes?: string;
  careerTimeline: {
    role: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologiesUsed: string[];
  }[];
  // DB & AI scores
  relevanceScore?: number;
  densityScore?: number;
  aiScore?: number | null;
  reasonToHire?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('find');
  const [searchResults, setSearchResults] = useState<Candidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // A cleaner, reusable TabButton component
  const TabButton = ({ tabId, label }: { tabId: Tab; label: string }) => (
    <button
      onClick={() => {
        setActiveTab(tabId);
        setHasSearched(false);
        setSearchResults([]);
      }}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
        ${activeTab === tabId
          ? 'bg-white text-indigo-700 shadow-sm'
          : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
        }`}
    >
      {label}
    </button>
  );

  const handleSearchResults = (results: Candidate[]) => {
    setSearchResults(results);
    setIsSearching(false);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Sereno Talent Intelligence
          </h1>
          <p className="mt-3 text-md text-slate-600 max-w-2xl mx-auto">
            The single source for parsing, storing, and discovering talent.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-10">
          <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
            <TabButton tabId="add" label="Add Candidate" />
            <TabButton tabId="find" label="Find Talent" />
          </div>
        </div>

        {/* Conditional Content */}
        <div className="mt-4">
          {activeTab === 'add' && <AddCandidateForm />}
          {activeTab === 'find' && (
            <div className="space-y-12">
              <FindTalentForm onSearch={handleSearchResults} isSearching={isSearching} />
              
              {isSearching && (
                <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-slate-500">Analyzing candidates with AI...</p>
                </div>
              )}

              {hasSearched && !isSearching && (
                 <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-6">Analysis Results ({searchResults.length})</h2>
                    {searchResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {searchResults.map((candidate) => (
                                <CandidateCard 
                                    key={candidate._id} 
                                    candidate={candidate}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-lg">
                            <h3 className="text-lg font-medium text-slate-800">No Matches Found</h3>
                            <p className="text-slate-500 mt-1">Try adjusting your search criteria.</p>
                        </div>
                    )}
                 </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}