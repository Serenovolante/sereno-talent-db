import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Candidate from '@/models/candidate';

const processTextToKeywords = (text: string | null | undefined): string[] => {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/,/g, ' ')
        .replace(/[^\w\s+#.-]/g, '')
        .split(/\s+/)
        .filter((term) => term.trim() !== '');
};

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { jd, keywords, experience, workPreference } = await request.json();

    const jdKeywords = processTextToKeywords(jd);
    const skillKeywords = processTextToKeywords(keywords);
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
    } else {
      return NextResponse.json([]);
    }

    const pipeline: any[] = [
      {
        $match: filter,
      }
    ];

    if (allKeywordsForScoring.length > 0) {
      const keywordsPattern = allKeywordsForScoring.join('|');
      
      // ========================== THE FIX ==========================
      // Dynamically create a condition for each keyword the user searched for.
      const matchConditions = skillKeywords.map(keyword => {
        return {
          $cond: [ // If...
            {
              $gt: [ // this condition is greater than 0...
                {
                  $size: { // the size of the array of skills that match the keyword
                    $filter: {
                      input: { $ifNull: ["$skills", []] },
                      as: "candidateSkill",
                      cond: { $regexMatch: { input: "$$candidateSkill", regex: keyword, options: "i" } }
                    }
                  }
                },
                0
              ]
            },
            1, // ...then return 1
            0  // ...else return 0
          ]
        };
      });

      pipeline.push({
        $addFields: {
          // Add up the 1s and 0s to get the count of unique keywords matched
          matchedSkillCount: {
            $add: matchConditions
          },
          // The density score for tie-breaking remains the same
          densityScore: {
            $add: [
              { $size: { $filter: { input: { $ifNull: ["$skills", []] }, as: "skill", cond: { $regexMatch: { input: "$$skill", regex: keywordsPattern, options: "i" } } } } },
              { $sum: { $map: { input: "$careerTimeline", as: "timeline", in: { $size: { $filter: { input: { $split: [{ $ifNull: ["$$timeline.description", ""] }, " "] }, cond: { $regexMatch: { input: "$$this", regex: keywordsPattern, options: "i" } } } } } } } },
            ]
          }
        }
      });

      // Now calculate the final score based on the corrected matchedSkillCount
      pipeline.push({
        $addFields: {
          relevanceScore: {
            $cond: {
              if: { $eq: [skillKeywords.length, 0] }, // Avoid division by zero
              then: 0,
              else: {
                $round: [
                  { $multiply: [{ $divide: ["$matchedSkillCount", skillKeywords.length] }, 100] }
                ]
              }
            }
          }
        }
      });
      // =========================================================

      // Sort primarily by the completeness score, then by the density score
      pipeline.push({ 
        $sort: { 
          relevanceScore: -1,
          densityScore: -1
        } 
      });
    }

    pipeline.push({ $limit: 50 });

    const candidates = await Candidate.aggregate(pipeline);

    return NextResponse.json(candidates);
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}