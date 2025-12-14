'use server';

import { z } from 'zod';
// The analyzeRepository function is now the single async function exported from the flow file.
import { analyzeRepository as analyzeRepositoryFlow } from '@/ai/flows/analyze-repository-flow';

// Define schemas for validation, and export types for usage in components.
const AnalyzeRepositoryInputSchema = z.object({
  repoUrl: z.string().url(),
});
export type AnalyzeRepositoryInput = z.infer<typeof AnalyzeRepositoryInputSchema>;

const RoadmapStepSchema = z.object({
  step: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
  effortEstimate: z.string(),
});

const AnalyzeRepositoryOutputSchema = z.object({
  analysis: z.object({
    codeQuality: z.number(),
    projectStructure: z.number(),
    documentation: z.number(),
    testCoverage: z.number(),
    realWorldRelevance: z.number(),
    commitConsistency: z.number(),
  }),
  score: z.object({
    numericalScore: z.number(),
    skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    badge: z.enum(['Bronze', 'Silver', 'Gold']),
  }),
  summary: z.object({
    summary: z.string(),
  }),
  roadmap: z.object({
    roadmap: z.array(RoadmapStepSchema),
  }),
  repoUrl: z.string().url(),
});
export type AnalyzeRepositoryOutput = z.infer<typeof AnalyzeRepositoryOutputSchema>;


export async function analyzeRepository(input: AnalyzeRepositoryInput): Promise<AnalyzeRepositoryOutput> {
  const validatedInput = AnalyzeRepositoryInputSchema.safeParse(input);

  if (!validatedInput.success) {
    // Creating a more detailed error message
    const errorMessage = validatedInput.error.issues.map(issue => issue.message).join(', ');
    throw new Error(`Invalid input: ${errorMessage}`);
  }

  try {
    const result = await analyzeRepositoryFlow(validatedInput.data);
    // We also validate the output from the AI to ensure it matches our schema
    const validatedOutput = AnalyzeRepositoryOutputSchema.safeParse(result);
    if (!validatedOutput.success) {
        console.error("AI output validation error:", validatedOutput.error);
        throw new Error("The AI returned data in an unexpected format.");
    }
    return validatedOutput.data;
  } catch (error: any) {
    console.error('Error in AI flow:', error);
    // Pass a more specific error message if available
    const message = error.message || 'Failed to generate repository analysis. The AI service may be temporarily unavailable.';
    throw new Error(message);
  }
}

export type AnalysisResult = Awaited<ReturnType<typeof analyzeRepository>>;
