'use server';

/**
 * @fileOverview A personalized roadmap generator for repository improvement.
 *
 * - generatePersonalizedRoadmap - A function that generates a roadmap for improving a repository.
 * - GeneratePersonalizedRoadmapInput - The input type for the generatePersonalizedRoadmap function.
 * - GeneratePersonalizedRoadmapOutput - The return type for the generatePersonalizedRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedRoadmapInputSchema = z.object({
  repositoryAnalysis: z
    .string()
    .describe('The analysis of the repository, including its strengths and weaknesses.'),
});
export type GeneratePersonalizedRoadmapInput = z.infer<typeof GeneratePersonalizedRoadmapInputSchema>;

const RoadmapStepSchema = z.object({
  step: z.string().describe('The actionable step to improve the repository.'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the step.'),
  effortEstimate: z.string().describe('An estimate of the effort required to complete the step.'),
});

const GeneratePersonalizedRoadmapOutputSchema = z.object({
  roadmap: z.array(RoadmapStepSchema).describe('A list of actionable steps to improve the repository.'),
});
export type GeneratePersonalizedRoadmapOutput = z.infer<typeof GeneratePersonalizedRoadmapOutputSchema>;

export async function generatePersonalizedRoadmap(
  input: GeneratePersonalizedRoadmapInput
): Promise<GeneratePersonalizedRoadmapOutput> {
  return generatePersonalizedRoadmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedRoadmapPrompt',
  input: {schema: GeneratePersonalizedRoadmapInputSchema},
  output: {schema: GeneratePersonalizedRoadmapOutputSchema},
  prompt: `You are an AI coding mentor that provides personalized roadmaps for developers to improve their GitHub repositories.

  Based on the repository analysis provided, generate a roadmap with actionable steps the developer must follow to improve their repository. Each step should include a priority level (High, Medium, Low) and an effort estimate.

  Repository Analysis: {{{repositoryAnalysis}}}
  
  Output the roadmap as a JSON array of RoadmapStep objects, where each object contains the step, priority, and effortEstimate.
  
  Format:
  {
   "roadmap": [
      {
       "step": "Improve folder structure",
        "priority": "High",
        "effortEstimate": "2 days"
      },
      {
        "step": "Add README.md with project overview and instructions",
        "priority": "High",
        "effortEstimate": "1 day"
      }
    ]
  }
  `,
});

const generatePersonalizedRoadmapFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedRoadmapFlow',
    inputSchema: GeneratePersonalizedRoadmapInputSchema,
    outputSchema: GeneratePersonalizedRoadmapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
