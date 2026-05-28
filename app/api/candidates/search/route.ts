import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Candidate from '@/models/candidate';
import OpenAI from 'openai';


// Initialize DeepSeek client
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: 'https://api.deepseek.com',
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
            {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: { $ifNull: ["$skills", []] },
                      as: "candidateSkill",
                      cond: {
                        $regexMatch: {
                          input: "$$candidateSkill",
                          regex: keyword,
                          options: "i"
                        }
                      }
                    }
                  }
                },
                0
              ]
            },
            1,
            0
          ]
        };
      });

      pipeline.push({
        $addFields: {
          matchedSkillCount: { $add: matchConditions },

          densityScore: {
            $add: [
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$skills", []] },
                    as: "skill",
                    cond: {
                      $regexMatch: {
                        input: "$$skill",
                        regex: allKeywordsForScoring.join('|'),
                        options: "i"
                      }
                    }
                  }
                }
              },

              {
                $sum: {
                  $map: {
                    input: "$careerTimeline",
                    as: "timeline",
                    in: {
                      $size: {
                        $filter: {
                          input: {
                            $split: [
                              { $ifNull: ["$$timeline.description", ""] },
                              " "
                            ]
                          },
                          cond: {
                            $regexMatch: {
                              input: "$$this",
                              regex: allKeywordsForScoring.join('|'),
                              options: "i"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
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

              else: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$matchedSkillCount",
                          skillKeywords.length
                        ]
                      },
                      100
                    ]
                  }
                ]
              }
            }
          }
        }
      });

      pipeline.push({
        $sort: {
          relevanceScore: -1,
          densityScore: -1
        }
      });

    } else if (Object.keys(filter).length === 0) {
      pipeline.push({ $sort: { name: 1 } });

    } else {
      pipeline.push({ $sort: { name: 1 } });
    }

    pipeline.push({ $limit: 30 });

    const initialCandidates = await Candidate.aggregate(pipeline);

    // --- Part 2: AI-Powered Analysis on the Results ---

    if (!initialCandidates || initialCandidates.length === 0) {
      return NextResponse.json([]);
    }

    if (!jd || jd.trim() === '') {

      if (allKeywordsForScoring.length === 0) {

        return NextResponse.json(
          initialCandidates.map(candidate => ({
            ...candidate,
            _id: candidate._id.toString(),
            expectedCTC: candidate.expectedCTC,
            relevanceScore: 0,
            densityScore: 0,
            aiScore: null,
            reasonToHire: '',
          }))
        );
      }

      return NextResponse.json(
        initialCandidates.map(candidate => ({
          ...candidate,
          _id: candidate._id.toString(),
          expectedCTC: candidate.expectedCTC,
        }))
      );
    }

    const chunkSize = 10;

    const finalEnrichedCandidates = [];

    for (let i = 0; i < initialCandidates.length; i += chunkSize) {

      const chunk = initialCandidates.slice(i, i + chunkSize);

      const candidatesForAI = chunk.map(c => {

        const { __v, ...rest } = c;

        return {
          ...rest,
          _id: c._id.toString(),
          expectedCTC: c.expectedCTC,
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

        Return ONLY a valid JSON object with a single key "results", which is an array. Do not include any other text, explanations, or markdown formatting. Each object in the array must follow this exact schema:
        {
          "candidateId": "string (must match the candidate's _id from the input)",
          "aiScore": number (0-100),
          "reasonToHire": "string (a short, compelling reason)"
        }
      `;

      try {

        const completion = await deepseek.chat.completions.create({
          model: 'deepseek-v4-flash',

          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],

          temperature: 0.3,
        });

        const aiResponse = completion.choices[0]?.message?.content;

        if (aiResponse) {

          const cleanText = aiResponse
            .replace(/^```json\s*/, '')
            .replace(/\s*```$/, '')
            .trim();

          const aiData: AIAnalysisResult[] =
            JSON.parse(cleanText).results;

          const aiDataMap = new Map(
            aiData.map((item: AIAnalysisResult) => [
              item.candidateId,
              item
            ])
          );

          const enrichedChunk = chunk.map(candidate => ({
            ...candidate,
            expectedCTC: candidate.expectedCTC,

            aiScore:
              aiDataMap.get(candidate._id.toString())?.aiScore ?? null,

            reasonToHire:
              aiDataMap.get(candidate._id.toString())?.reasonToHire ??
              'AI analysis could not be completed.',
          }));

          finalEnrichedCandidates.push(...enrichedChunk);
        }

      } catch (error) {

        console.error('DeepSeek API call failed for a chunk:', error);

        const failedChunk = chunk.map(candidate => ({
          ...candidate,
          expectedCTC: candidate.expectedCTC,

          aiScore: null,

          reasonToHire:
            'AI analysis failed for this candidate.',
        }));

        finalEnrichedCandidates.push(...failedChunk);
      }
    }

    finalEnrichedCandidates.sort(
      (a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0)
    );

    return NextResponse.json(finalEnrichedCandidates);

  } catch (error: any) {

    console.error('Search error:', error);

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}