"use client";

import { useState } from 'react';
import { AddCandidateForm } from '@/components/candidate/AddCandidateForm';
import { FindTalentForm } from '@/components/candidate/FindTalentSection';
import { CandidateCard } from '@/components/candidate/CandidateCard';

type Tab = 'add' | 'find';

// Candidate interface remains unchanged.
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

    // TabButton component restyled to match the clean, high-contrast aesthetic.
    const TabButton = ({ tabId, label }: { tabId: Tab; label: string }) => (
        <button
            onClick={() => {
                setActiveTab(tabId);
                setHasSearched(false);
                setSearchResults([]);
            }}
            className={`px-5 py-2 text-sm cursor-pointer font-medium rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-800
        ${activeTab === tabId
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
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

    const handleDeleteCandidate = async (id: string) => {
        try {
            const response = await fetch(`/api/candidates/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                // Remove the deleted candidate from the search results
                setSearchResults(prevResults => 
                    prevResults.filter(candidate => candidate._id !== id)
                );
                alert('Candidate deleted successfully!');
            } else {
                alert(data.error || 'Failed to delete candidate');
            }
        } catch (error) {
            console.error('Error deleting candidate:', error);
            alert('An error occurred while deleting the candidate');
        }
    };

    return (
        // A light, neutral background for the entire page.
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* HEADER: Your original content with updated, cleaner styling. */}
            <header className="pb-8 pt-4 bg-white shadow-lg mb-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center space-x-4 mb-2">
                        <img src="/Sereno_Logo.png" alt="Sereno Logo" className="h-12" />
                        <h1 className="text-2xl font-bold text-gray-900">
                            Sereno Talent Graph
                        </h1>
                    </div>
                    <p className="text-gray-500 ml-3">
                        AI-native platform to parse, understand, and match talent at enterprise scale.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {/* All interactive content is now inside a single, clean white card. */}
                <div className="bg-white relative  p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200">

                    {/* Tab Navigation: Centered at the top of the card. */}
                    <div className=" mb-8 absolute top-3 right-3">
                        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                            <TabButton tabId="add" label="Add Candidate" />
                            <TabButton tabId="find" label="Find Talent" />
                        </div>
                    </div>

                    {/* Conditional Content */}
                    <div className='mt-4'>
                        {activeTab === 'add' && <AddCandidateForm />}
                        {activeTab === 'find' && (
                            <div className="space-y-10">
                                <FindTalentForm onSearch={handleSearchResults} isSearching={isSearching} />

                                {/* SEARCHING OVERLAY: A more subtle, modern loading state. */}
                                {isSearching && (
                                    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
                                        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full mx-4 border border-gray-200">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
                                            <p className="mt-4 text-gray-700 font-medium">Analyzing candidates with AI...</p>
                                            <p className="text-gray-500 text-sm mt-2">Please wait, this may take a moment.</p>
                                        </div>
                                    </div>
                                )}

                                {/* RESULTS */}
                                {hasSearched && !isSearching && (
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800 mb-6">Analysis Results ({searchResults.length})</h2>
                                        {searchResults.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
                                                {searchResults.map((candidate) => (
                                                    <CandidateCard
                                                        key={candidate._id}
                                                        candidate={candidate}
                                                        onDelete={handleDeleteCandidate}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            // EMPTY STATE: A cleaner, more intentional design.
                                            <div className="text-center py-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                                                <h3 className="text-base font-semibold text-gray-800">No Matches Found</h3>
                                                <p className="text-gray-500 text-sm mt-1">Try adjusting your search criteria.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER: Kept your original text with cleaner styling. */}
                <div className="pt-8 mt-8 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-500 italic">
                        Backed by Sereno AI Core - auto-parses resumes, infers skills, and ranks candidates by contextual fit
                    </p>
                </div>
            </main>
        </div>
    );
}