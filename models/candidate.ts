import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  technologiesUsed: [{ type: String }],
});

const CareerTimelineSchema = new mongoose.Schema({
  role: String,
  company: String,
  startDate: String,
  endDate: String,
  description: String,
});

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, unique: true, sparse: true },

  phone: { type: String },

  location: { type: String, index: true },

  skills: [{ type: String, index: true }],

  totalExperience: { type: Number, index: true },

  workPreference: {
    type: String,
    default: 'Open to all',
    index: true,
  },

  customNotes: {
    type: String,
  },

  expectedCTC: {
    type: String,
    default: '',
  },

  careerTimeline: [CareerTimelineSchema],

  projects: [ProjectSchema],

}, { timestamps: true });

export default mongoose.models.Candidate ||
  mongoose.model('Candidate', CandidateSchema);