'use server';

import { z } from 'zod';
// The analyzeRepository function is now the single async function exported from the flow file.
import { analyzeRepository as analyzeRepositoryFlow } from '@/ai/flows/analyze-repository-flow';

// Define schemas and types here to keep the "use server" file clean.
export const AnalyzeRepositoryInputSchema = z.object({
  repoUrl: z.string().url(),
});
export type AnalyzeRepositoryInput = z.infer<typeof AnalyzeRepositoryInputSchema>;

const RoadmapStepSchema = z.object({
  step: z.string().describe('The actionable step to improve the repository.'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the step.'),
  effortEstimate: z.string().describe('An estimate of the effort required to complete the step.'),
});

export const AnalyzeRepositoryOutputSchema = z.object({
  analysis: z.object({
    codeQuality: z.number().min(0).max(100),
    projectStructure: z.number().min(0).max(100),
    documentation: z.number().min(0).max(100),
    testCoverage: z.number().min(0).max(100),
    realWorldRelevance: z.number().min(0).max(100),
    commitConsistency: z.number().min(0).max(100),
  }),
  score: z.object({
    numericalScore: z.number().describe('A numerical score representing the overall quality of the repository (0-100).'),
    skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe('The skill level category of the repository.'),
    badge: z.enum(['Bronze', 'Silver', 'Gold']).describe('The badge associated with the repository.'),
  }),
  summary: z.object({
    summary: z.string().describe('A concise (2-3 sentences) summary of the repository\'s strengths and weaknesses.'),
  }),
  roadmap: z.object({
    roadmap: z.array(RoadmapStepSchema).describe('A list of actionable steps to improve the repository.'),
  }),
  // This is added by the flow wrapper, so it's not in the AI output schema.
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
    return result;
  } catch (error: any) {
    console.error('Error in AI flow:', error);
    // Pass a more specific error message if available
    const message = error.message || 'Failed to generate repository analysis. The AI service may be temporarily unavailable.';
    throw new Error(message);
  }
}

export type AnalysisResult = Awaited<ReturnType<typeof analyzeRepository>>;
