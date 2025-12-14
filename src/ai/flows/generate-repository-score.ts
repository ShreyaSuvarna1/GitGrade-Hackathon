'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a repository score, skill level, and badge based on repository analysis.
 *
 * - generateRepositoryScore - A function that generates the repository score, skill level, and badge.
 * - GenerateRepositoryScoreInput - The input type for the generateRepositoryScore function.
 * - GenerateRepositoryScoreOutput - The return type for the generateRepositoryScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRepositoryScoreInputSchema = z.object({
  codeQuality: z.number().describe('A score representing the code quality of the repository (0-100).'),
  projectStructure: z.number().describe('A score representing the project structure and organization (0-100).'),
  documentation: z.number().describe('A score representing the quality of documentation (0-100).'),
  testCoverage: z.number().describe('A score representing the test coverage (0-100).'),
  realWorldRelevance: z.number().describe('A score representing the real-world relevance and usefulness (0-100).'),
  commitConsistency: z.number().describe('A score representing the commit and development consistency (0-100).'),
});
export type GenerateRepositoryScoreInput = z.infer<typeof GenerateRepositoryScoreInputSchema>;

const GenerateRepositoryScoreOutputSchema = z.object({
  numericalScore: z.number().describe('A numerical score representing the overall quality of the repository (0-100).'),
  skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe('The skill level category of the repository.'),
  badge: z.enum(['Bronze', 'Silver', 'Gold']).describe('The badge associated with the repository.'),
});
export type GenerateRepositoryScoreOutput = z.infer<typeof GenerateRepositoryScoreOutputSchema>;

export async function generateRepositoryScore(input: GenerateRepositoryScoreInput): Promise<GenerateRepositoryScoreOutput> {
  return generateRepositoryScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRepositoryScorePrompt',
  input: {schema: GenerateRepositoryScoreInputSchema},
  output: {schema: GenerateRepositoryScoreOutputSchema},
  prompt: `You are an AI expert in evaluating GitHub repositories. Based on the following scores for different dimensions of the repository, generate an overall numerical score (0-100), a skill level category (Beginner/Intermediate/Advanced), and a badge (Bronze/Silver/Gold) that objectively represents the repository's quality.

Code Quality: {{{codeQuality}}}
Project Structure: {{{projectStructure}}}
Documentation: {{{documentation}}}
Test Coverage: {{{testCoverage}}}
Real-world Relevance: {{{realWorldRelevance}}}
Commit Consistency: {{{commitConsistency}}}

Follow these rules when generating the output:

- The numerical score should be a weighted average of the input scores, with the following weights:
    - Code Quality: 30%
    - Project Structure: 20%
    - Documentation: 15%
    - Test Coverage: 15%
    - Real-world Relevance: 10%
    - Commit Consistency: 10%
- The skill level category should be determined as follows:
    - Beginner: 0-50
    - Intermediate: 51-80
    - Advanced: 81-100
- The badge should be determined as follows:
    - Bronze: 0-40
    - Silver: 41-70
    - Gold: 71-100`,
});

const generateRepositoryScoreFlow = ai.defineFlow(
  {
    name: 'generateRepositoryScoreFlow',
    inputSchema: GenerateRepositoryScoreInputSchema,
    outputSchema: GenerateRepositoryScoreOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
