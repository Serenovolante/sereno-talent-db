import { X, MapPin, Briefcase, Mail, Phone, Sparkles, BrainCircuit, Copy } from 'lucide-react';
import { Candidate } from './CandidateCard';

interface ProfileModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper to format experience years - rounded to single decimal place
const formatExperience = (years?: number) => {
    if (years === undefined || years === null) return null;
    
    // Round to single decimal place
    const roundedYears = Number(years.toFixed(1));
    
    if (roundedYears < 1) {
        const months = Math.round(roundedYears * 12);
        return `${months} mos exp`;
    } 
    return `${roundedYears} yrs exp`;
};

export const ProfileModal = ({ candidate, isOpen, onClose }: ProfileModalProps) => {
  if (!isOpen || !candidate) return null;

  const experienceText = candidate.totalExperience !== undefined ? formatExperience(candidate.totalExperience) : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ borderRadius: '12px' }}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{candidate.name}</h2>
            <div className="flex items-center gap-4 mt-2">
              {candidate.location && (
                <div className="flex items-center text-slate-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{candidate.location}</span>
                </div>
              )}
              {experienceText && (
                <div className="flex items-center text-slate-600">
                  <Briefcase className="w-4 h-4 mr-1" />
                  <span>{experienceText}</span>
                </div>
              )}
              {candidate.email && (
                <div 
                  className="flex items-center text-slate-600 hover:text-slate-800 cursor-pointer" 
                  onClick={() => copyToClipboard(candidate.email!)}
                  title="Click to copy email"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  <span className="mr-1">{candidate.email}</span>
                  <Copy className="w-3 h-3" />
                </div>
              )}
              {candidate.phone && (
                <div 
                  className="flex items-center text-slate-600 hover:text-slate-800 cursor-pointer" 
                  onClick={() => copyToClipboard(candidate.phone!)}
                  title="Click to copy phone"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  <span className="mr-1">{candidate.phone}</span>
                  <Copy className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* AI Analysis */}
          {(candidate.aiScore !== undefined || candidate.reasonToHire) && (
            <div className="mb-8 p-4 bg-slate-50 rounded-lg" style={{ borderRadius: '8px' }}>
              <h3 className="flex items-center text-lg font-semibold text-slate-900 mb-3">
                <Sparkles className="w-5 h-5 mr-2 text-slate-600" />
                AI Analysis
              </h3>
              {candidate.aiScore !== undefined && (
                <div className="flex items-center mb-3">
                  <BrainCircuit className="w-4 h-4 text-slate-700 mr-2" />
                  <span className="font-medium">AI Score: </span>
                  <span className="ml-2 px-2 py-1 bg-slate-200 text-slate-800 rounded text-sm font-medium">
                    {candidate.aiScore}
                  </span>
                </div>
              )}
              {candidate.reasonToHire && (
                <p className="text-slate-700 italic">"{candidate.reasonToHire}"</p>
              )}
            </div>
          )}

          {/* Work Preference and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 mb-8  gap-6">
            {candidate.workPreference && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Work Preference</h3>
                <p className="text-slate-700">{candidate.workPreference}</p>
              </div>
            )}
            {candidate.customNotes && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Notes</h3>
                <p className="text-slate-700">{candidate.customNotes}</p>
              </div>
            )}
          </div>

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-sm font-medium"
                    style={{ borderRadius: '9999px' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Career Timeline */}
          {candidate.careerTimeline && candidate.careerTimeline.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Career Timeline</h3>
              <div className="space-y-4">
                {candidate.careerTimeline.map((job, index) => (
                  <div key={index} className="border-l-2 border-slate-300 pl-4 py-1">
                    <h4 className="font-semibold text-slate-800">{job.role} at {job.company}</h4>
                    <p className="text-slate-600 text-sm">{job.startDate} - {job.endDate}</p>
                    {job.description && <p className="text-slate-700 mt-1">{job.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {candidate.projects && candidate.projects.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Projects</h3>
              <div className="space-y-4">
                {candidate.projects.map((project, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4" style={{ borderRadius: '8px' }}>
                    <h4 className="font-semibold text-slate-800">{project.name}</h4>
                    {project.description && <p className="text-slate-700 mt-2">{project.description}</p>}
                    {project.technologiesUsed && project.technologiesUsed.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm font-medium text-slate-700">Technologies: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {project.technologiesUsed.map((tech, techIndex) => (
                            <span 
                              key={techIndex} 
                              className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                              style={{ borderRadius: '4px' }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-md font-medium hover:bg-slate-900"
            style={{ borderRadius: '8px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};