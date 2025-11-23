import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Candidate from '@/models/candidate';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to process keywords
const processTextToKeywords = (text: string | null | undefined): string[] => {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/,/g, ' ')
        .replace(/[^\w\s+#.-]/g, '')
        .split(/\s+/)
        .filter((term) => term.trim() !== '');
};

// Define types for AI analysis results
interface AIAnalysisResult {
  candidateId: string;
  aiScore: number;
  reasonToHire: string;
}

// --- Main API Handler ---
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { jd, keywords, experience, workPreference } = await request.json();

    // --- Part 1: Your Full MongoDB Aggregation Pipeline ---
    // This entire section is your proven logic for filtering and scoring.
    
    const skillKeywords = processTextToKeywords(keywords);
    const jdKeywords = processTextToKeywords(jd);
    const allKeywordsForScoring = [...new Set([...jdKeywords, ...skillKeywords])];

    const filter: any = {};

    if (experience) {
      filter.totalExperience = { $gte: parseInt(experience, 10) };
    }
    if (workPreference && workPreference !== 'Any') {
      filter.workPreference = { $regex: workPreference, $options: 'i' };
    }
    if (skillKeywords.length > 0) {
      const keywordsRegex = skillKeywords.map(keyword => new RegExp(keyword, "i"));
      filter.skills = { $in: keywordsRegex };
    }

    const pipeline: any[] = [
      { $match: filter }
    ];

    if (allKeywordsForScoring.length > 0) {
      const matchConditions = skillKeywords.map(keyword => {
        return {
          $cond: [
            { $gt: [{ $size: { $filter: { input: { $ifNull: ["$skills", []] }, as: "candidateSkill", cond: { $regexMatch: { input: "$$candidateSkill", regex: keyword, options: "i" } } } } }, 0] },
            1, 0
          ]
        };
      });

      pipeline.push({
        $addFields: {
          matchedSkillCount: { $add: matchConditions },
          densityScore: {
            $add: [
              { $size: { $filter: { input: { $ifNull: ["$skills", []] }, as: "skill", cond: { $regexMatch: { input: "$$skill", regex: allKeywordsForScoring.join('|'), options: "i" } } } } },
              { $sum: { $map: { input: "$careerTimeline", as: "timeline", in: { $size: { $filter: { input: { $split: [{ $ifNull: ["$$timeline.description", ""] }, " "] }, cond: { $regexMatch: { input: "$$this", regex: allKeywordsForScoring.join('|'), options: "i" } } } } } } } }
            ]
          }
        }
      });

      pipeline.push({
        $addFields: {
          relevanceScore: {
            $cond: {
              if: { $eq: [skillKeywords.length, 0] },
              then: 0,
              else: { $round: [{ $multiply: [{ $divide: ["$matchedSkillCount", skillKeywords.length] }, 100] }] }
            }
          }
        }
      });

      pipeline.push({ $sort: { relevanceScore: -1, densityScore: -1 } });
    } else if (Object.keys(filter).length === 0) {
      // If no filter criteria or keywords, just get all candidates and sort by name
      pipeline.push({ $sort: { name: 1 } });
    } else {
      // If only filters were provided (e.g. experience, work preference), sort by name
      pipeline.push({ $sort: { name: 1 } });
    }

    pipeline.push({ $limit: 30 }); // Limit to a reasonable number for AI processing

    // Execute the full pipeline to get the initial sorted and scored candidates
    const initialCandidates = await Candidate.aggregate(pipeline);

    // --- Part 2: AI-Powered Analysis on the Results ---

    if (!initialCandidates || initialCandidates.length === 0) {
      return NextResponse.json([]);
    }
    if (!jd || jd.trim() === '') {
      // If no JD, we can't do AI analysis, so return the DB-scored results directly.
      // If there were no keywords, just return the filtered candidates without scoring
      if (allKeywordsForScoring.length === 0) {
        return NextResponse.json(initialCandidates.map(candidate => ({
          ...candidate,
          _id: candidate._id.toString(),
          relevanceScore: 0,  // Adding this for consistent response format
          densityScore: 0,    // Adding this for consistent response format
          aiScore: null,      // Adding this for consistent response format
          reasonToHire: '',   // Adding this for consistent response format
        })));
      }
      return NextResponse.json(initialCandidates);
    }

    const chunkSize = 10;
    const finalEnrichedCandidates = [];

    for (let i = 0; i < initialCandidates.length; i += chunkSize) {
      const chunk = initialCandidates.slice(i, i + chunkSize);
      
      const candidatesForAI = chunk.map(c => {
        const { __v, ...rest } = c; // Remove MongoDB's version key
        return {
          ...rest,
          _id: c._id.toString()
        };
      });
      
      const prompt = `
        You are an expert HR recruitment analyst. Your task is to evaluate a list of pre-filtered candidates against a specific job description using their full resume data.

        **Job Description:**
        ---
        ${jd}
        ---

        **Full Candidate Data (JSON Array):**
        ---
        ${JSON.stringify(candidatesForAI, null, 2)}
        ---

        **Instructions:**
        Analyze each candidate based on their entire provided data. The candidates are already pre-sorted by keyword relevance. Provide a final suitability score from 0 to 100 and a concise, one-sentence reason explaining their fit for the role.

        Return your response as a single, valid JSON object with a single key "results", which is an array. Do not include any other text, explanations, or markdown formatting. Each object in the array must follow this exact schema:
        {
          "candidateId": "string (must match the candidate's _id from the input)",
          "aiScore": "number (0-100)",
          "reasonToHire": "string (a short, compelling reason)"
        }
      `;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are an expert HR analyst that only responds with valid JSON." },
            { role: "user", content: prompt }
          ],
        });

        const aiResponse = completion.choices[0].message.content;
        if (aiResponse) {
          const aiData: AIAnalysisResult[] = JSON.parse(aiResponse).results;
          const aiDataMap = new Map(aiData.map((item: AIAnalysisResult) => [item.candidateId, item]));

          const enrichedChunk = chunk.map(candidate => ({
            ...candidate,
            aiScore: aiDataMap.get(candidate._id.toString())?.aiScore ?? null,
            reasonToHire: aiDataMap.get(candidate._id.toString())?.reasonToHire ?? 'AI analysis could not be completed.',
          }));
          
          finalEnrichedCandidates.push(...enrichedChunk);
        }
      } catch (error) {
        console.error("OpenAI API call failed for a chunk:", error);
        const failedChunk = chunk.map(candidate => ({
          ...candidate,
          aiScore: null,
          reasonToHire: "AI analysis failed for this candidate.",
        }));
        finalEnrichedCandidates.push(...failedChunk);
      }
    }

    // Sort the final results based on the AI score
    finalEnrichedCandidates.sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));

    return NextResponse.json(finalEnrichedCandidates);

  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}