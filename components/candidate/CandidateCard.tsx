import { Briefcase, MapPin, BrainCircuit, Sparkles } from 'lucide-react';

// Make sure your Candidate type is accessible here. 
// You can move it to a shared types file or import from page.tsx
export interface Candidate {
  _id: string;
  name: string;
  skills: string[];
  totalExperience?: number;
  location?: string;
  careerTimeline: { role: string; company: string, description: string }[];
  // AI Enriched Fields
  aiScore?: number | null;
  reasonToHire?: string;
  // DB Score Fields
  relevanceScore?: number;
  densityScore?: number;
}

interface CandidateCardProps {
  candidate: Candidate;
}

// Helper to format experience years
const formatExperience = (years?: number) => {
    if (years === undefined || years === null) return null;
    return years < 1 ? `${Math.round(years * 12)} mos exp` : `${years} ${years === 1 ? 'yr' : 'yrs'} exp`;
};

// Helper to get the most recent role
const getPrimaryRole = (candidate: Candidate) => {
    if (candidate.careerTimeline && candidate.careerTimeline.length > 0) {
        return `${candidate.careerTimeline[0].role}`;
    }
    return "No role specified";
};

export const CandidateCard = ({ candidate }: CandidateCardProps) => {
  const primaryRole = getPrimaryRole(candidate);
  const experienceText = formatExperience(candidate.totalExperience);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex flex-col h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      {/* Card Header with Name and AI Score */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-slate-800">{candidate.name}</h3>
          <p className="text-sm text-slate-500 truncate" title={primaryRole}>{primaryRole}</p>
        </div>
        {candidate.aiScore !== null && candidate.aiScore !== undefined && (
          <div className="flex-shrink-0 text-right">
             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                <BrainCircuit className="w-4 h-4" />
                {candidate.aiScore}
             </span>
             <p className="text-xs text-slate-400 mt-1">AI Score</p>
          </div>
        )}
      </div>

      {/* Key Info Section */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
        {candidate.location && (
            <div className="flex items-center">
                <MapPin className="w-4 h-4 text-slate-400 mr-1.5" />
                <span>{candidate.location}</span>
            </div>
        )}
        {experienceText && (
            <div className="flex items-center">
                <Briefcase className="w-4 h-4 text-slate-400 mr-1.5" />
                <span>{experienceText}</span>
            </div>
        )}
      </div>

       {/* AI Analysis Section */}
       {candidate.reasonToHire && (
        <div className="mt-4 pt-4 border-t border-slate-100">
           <h4 className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
             <Sparkles className="w-3 h-3 mr-1.5 text-indigo-500" />
             AI Analysis
            </h4>
           <p className="mt-2 text-sm text-slate-700 italic">"{candidate.reasonToHire}"</p>
        </div>
      )}

      {/* Top Skills Section */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex-grow">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Skills</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {candidate.skills.slice(0, 5).map((skill, idx) => (
              <span key={idx} className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                {skill}
              </span>
            ))}
            {candidate.skills.length > 5 && (
                 <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-xs font-medium">
                    +{candidate.skills.length - 5} more
                 </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};