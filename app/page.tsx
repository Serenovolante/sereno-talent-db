"use client";

import { useState } from 'react';
import { AddCandidateForm } from '@/components/candidate/AddCandidateForm';
import { FindTalentForm } from '@/components/candidate/FindTalentSection';

type Tab = 'add' | 'find';

interface Candidate {
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
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('add');
  const [searchResults, setSearchResults] = useState<Candidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const TabButton = ({ tabId, label }: { tabId: Tab; label: string }) => (
    <button
      onClick={() => {
        setActiveTab(tabId);
        if (tabId === 'find') {
          setSearchResults([]); // Clear results when switching to find tab
        }
      }}
      className={`px-4 py-2.5 text-sm font-medium rounded-md transition-colors
        ${activeTab === tabId
          ? 'bg-blue-600 text-white shadow'
          : 'text-gray-600 hover:bg-gray-200'
        }`}
    >
      {label}
    </button>
  );

  const handleSearchResults = (results: Candidate[]) => {
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSearchSubmit = async (formData: any) => {
    setIsSearching(true);
    // The search API call is now handled in FindTalentForm
  };

  // Format experience for display
  const formatExperience = (years?: number) => {
    if (years === undefined) return 'Not specified';
    return years === 1 ? '1 year' : `${years} years`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Sereno Talent Database
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          The single source for parsing, storing, and discovering talent.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2 bg-gray-100 p-1.5 rounded-lg">
          <TabButton tabId="add" label="Add Candidate" />
          <TabButton tabId="find" label="Find Talent" />
        </div>
      </div>

      {/* Conditional Content */}
      <div className="mt-4">
        {activeTab === 'add' && <AddCandidateForm />}
        {activeTab === 'find' && (
          <>
            <FindTalentForm onSearch={handleSearchResults} isSearching={isSearching} />
            
            {/* Display search results */}
            {searchResults.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Search Results ({searchResults.length})</h2>
                <div className="space-y-4">
                  {searchResults.map((candidate) => (
                    <div key={candidate._id} className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{candidate.name}</h3>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {candidate.location && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {candidate.location}
                              </span>
                            )}
                            {candidate.totalExperience !== undefined && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {formatExperience(candidate.totalExperience)}
                              </span>
                            )}
                            {candidate.workPreference && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {candidate.workPreference}
                              </span>
                            )}
                          </div>
                          
                          {candidate.skills && candidate.skills.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-sm font-medium text-gray-700">Skills</h4>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {candidate.skills.slice(0, 5).map((skill, idx) => (
                                  <span 
                                    key={idx} 
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {candidate.skills.length > 5 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                    +{candidate.skills.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {candidate.relevanceScore !== undefined && (
                          <div className="text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Score: {candidate.relevanceScore}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {candidate.careerTimeline && candidate.careerTimeline.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700">Recent Experience</h4>
                          <ul className="mt-1 space-y-1">
                            {candidate.careerTimeline.slice(0, 2).map((job, idx) => (
                              <li key={idx} className="text-sm text-gray-600">
                                <span className="font-medium">{job.role}</span> at <span className="font-medium">{job.company}</span>
                                {job.startDate && job.endDate && (
                                  <span> ({job.startDate} - {job.endDate})</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {isSearching && (
              <div className="mt-8 text-center">
                <p className="text-gray-600">Searching talent pool...</p>
              </div>
            )}
            
            {!isSearching && searchResults.length === 0 && activeTab === 'find' && (
              <div className="mt-8 text-center">
                <p className="text-gray-600">Enter search criteria to find candidates.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}