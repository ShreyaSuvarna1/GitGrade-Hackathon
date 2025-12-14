'use server';

import { z } from 'zod';
import { runFullAnalysis } from '@/ai/flows/analyze-repository-flow';

const analyzeRepositoryInputSchema = z.object({
  repoUrl: z.string().url(),
});

export async function analyzeRepository(input: z.infer<typeof analyzeRepositoryInputSchema>) {
  const validatedInput = analyzeRepositoryInputSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new Error('Invalid input');
  }

  try {
    const result = await runFullAnalysis(validatedInput.data);
    return result;
  } catch (error) {
    console.error('Error in AI flows:', error);
    throw new Error('Failed to generate repository analysis. The AI service may be temporarily unavailable.');
  }
}

export type AnalysisResult = Awaited<ReturnType<typeof analyzeRepository>>;
