import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import PDFParse from 'pdf-parse-fork';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Candidate from '@/models/candidate';
import connectToDatabase from '@/lib/mongodb';

async function parseResume(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  } else if (file.type === 'application/pdf') {
    const data = await PDFParse(buffer);
    return data.text;
  }

  throw new Error('Unsupported file type');
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const customNotes: string | null = data.get('customNotes') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const resumeText = await parseResume(file);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert resume parser. Your task is to analyze the provided resume text and custom notes, and return a structured JSON object containing the candidate's information.

      The JSON object should follow this exact schema:
      {
        "name": "string",
        "email": "string",
        "phone": "string",
        "location": "string",
        "skills": ["string"],
        "totalExperience": "number",
        "workPreference": "default: 'Open to all', 'Full Time' , 'contract' , 'part time' , 'remote' , 'internship'",
        "customNotes": "string",
        "careerTimeline": [
          {
            "role": "string",
            "company": "string", 
            "startDate": "string",
            "endDate": "string",
            "description": "string"
          }
        ],
        "projects": [
          {
            "name": "string",
            "description": "string",
            "technologiesUsed": ["string"]
          }
        ]
      }

      Here is the resume text:
      ---
      ${resumeText}
      ---

      Here are the custom notes:
      ---
      ${customNotes || 'No custom notes provided'}
      ---

      Instructions:
      - Extract all relevant information from the resume text
      - Return ONLY a valid JSON object, no markdown formatting or extra text
      - If a field is not available, use null for strings/objects or empty array [] for arrays
      - For totalExperience, calculate based on work history (return as number in years)
      - For workPreference, infer from resume or use null if not mentioned
      - Include the custom notes in the customNotes field
      - Ensure all dates are in a consistent format (YYYY-MM or YYYY)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    const candidateData = JSON.parse(cleanText);

    const newCandidate = new Candidate(candidateData);
    await newCandidate.save();

    return NextResponse.json({ success: true, candidate: newCandidate });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process file' }, { status: 500 });
  }
}