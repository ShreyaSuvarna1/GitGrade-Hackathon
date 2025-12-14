'use server';

import { generatePersonalizedRoadmap } from '@/ai/flows/generate-personalized-roadmap';
import { generateRepositoryScore } from '@/ai/flows/generate-repository-score';
import { generateRepositorySummary } from '@/ai/flows/generate-repository-summary';
import { z } from 'zod';

const analyzeRepositoryInputSchema = z.object({
  repoUrl: z.string().url(),
});

// A helper function to generate a random integer
const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export async function analyzeRepository(input: z.infer<typeof analyzeRepositoryInputSchema>) {
  const validatedInput = analyzeRepositoryInputSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new Error('Invalid input');
  }

  // --- MOCK DATA GENERATION ---
  // This simulates fetching data from the GitHub API and performing initial analysis.
  const mockScores = {
    codeQuality: getRandomInt(40, 95),
    projectStructure: getRandomInt(50, 98),
    documentation: getRandomInt(30, 90),
    testCoverage: getRandomInt(0, 85),
    realWorldRelevance: getRandomInt(60, 100),
    commitConsistency: getRandomInt(50, 95),
  };

  const mockSummaries = {
    codeQuality: 'Code is generally well-structured, but some functions have high cyclomatic complexity.',
    projectStructure: 'The project follows a standard layout for its framework, making it easy to navigate.',
    documentation: 'A README exists, but lacks detailed setup instructions and API documentation.',
    testCoverage: 'Some critical components are tested, but overall coverage is low.',
    realWorldRelevance: 'The project solves a relevant problem and could be used in a real-world scenario.',
    commitConsistency: 'Commit history shows consistent work, but messages could be more descriptive.',
  };
  
  const mockAnalysis = Object.entries(mockSummaries).map(([key, value]) => `${key}: ${value}`).join('\n');

  // --- AI FLOW EXECUTION ---
  try {
    const [score, summary, roadmap] = await Promise.all([
      generateRepositoryScore(mockScores),
      generateRepositorySummary(mockSummaries),
      generatePersonalizedRoadmap({ repositoryAnalysis: mockAnalysis }),
    ]);

    return {
      score,
      summary,
      roadmap,
      repoUrl: validatedInput.data.repoUrl,
    };
  } catch (error) {
    console.error('Error in AI flows:', error);
    throw new Error('Failed to generate repository analysis. The AI service may be temporarily unavailable.');
  }
}

export type AnalysisResult = Awaited<ReturnType<typeof analyzeRepository>>;
