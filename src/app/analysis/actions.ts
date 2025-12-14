'use server';

import { z } from 'zod';
import { analyzeRepository as analyzeRepositoryFlow, AnalyzeRepositoryInputSchema } from '@/ai/flows/analyze-repository-flow';

export async function analyzeRepository(input: z.infer<typeof AnalyzeRepositoryInputSchema>) {
  const validatedInput = AnalyzeRepositoryInputSchema.safeParse(input);

  if (!validatedInput.success) {
    // Creating a more detailed error message
    const errorMessage = validatedInput.error.issues.map(issue => issue.message).join(', ');
    throw new Error(`Invalid input: ${errorMessage}`);
  }

  try {
    const result = await analyzeRepositoryFlow(validatedInput.data);
    return result;
  } catch (error: any) {
    console.error('Error in AI flow:', error);
    // Pass a more specific error message if available
    const message = error.message || 'Failed to generate repository analysis. The AI service may be temporarily unavailable.';
    throw new Error(message);
  }
}

export type AnalysisResult = Awaited<ReturnType<typeof analyzeRepository>>;
