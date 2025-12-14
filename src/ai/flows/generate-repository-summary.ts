'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a concise summary of a GitHub repository's strengths and weaknesses.
 *
 * - generateRepositorySummary -  Generates a short evaluation (2-3 sentences) describing the repository's current quality
 * - GenerateRepositorySummaryInput - The input type for the generateRepositorySummary function.
 * - GenerateRepositorySummaryOutput - The return type for the generateRepositorySummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRepositorySummaryInputSchema = z.object({
  codeQuality: z.string().describe('A summary of the code quality analysis.'),
  projectStructure: z.string().describe('A summary of the project structure and organization.'),
  documentation: z.string().describe('A summary of the documentation and clarity.'),
  testCoverage: z.string().describe('A summary of the test coverage and maintainability.'),
  realWorldRelevance: z.string().describe('A summary of the real-world relevance and usefulness.'),
  commitConsistency: z.string().describe('A summary of the commit and development consistency.'),
});

export type GenerateRepositorySummaryInput = z.infer<typeof GenerateRepositorySummaryInputSchema>;

const GenerateRepositorySummaryOutputSchema = z.object({
  summary: z.string().describe('A concise (2-3 sentences) summary of the repository\'s strengths and weaknesses.'),
});

export type GenerateRepositorySummaryOutput = z.infer<typeof GenerateRepositorySummaryOutputSchema>;

export async function generateRepositorySummary(input: GenerateRepositorySummaryInput): Promise<GenerateRepositorySummaryOutput> {
  return generateRepositorySummaryFlow(input);
}

const generateRepositorySummaryPrompt = ai.definePrompt({
  name: 'generateRepositorySummaryPrompt',
  input: {schema: GenerateRepositorySummaryInputSchema},
  output: {schema: GenerateRepositorySummaryOutputSchema},
  prompt: `You are an AI code reviewer.  Based on the following analysis of a GitHub repository, write a concise 2-3 sentence summary of the repository\'s strengths and weaknesses.

Code Quality: {{{codeQuality}}}
Project Structure: {{{projectStructure}}}
Documentation: {{{documentation}}}
Test Coverage: {{{testCoverage}}}
Real-World Relevance: {{{realWorldRelevance}}}
Commit Consistency: {{{commitConsistency}}}`,
});

const generateRepositorySummaryFlow = ai.defineFlow(
  {
    name: 'generateRepositorySummaryFlow',
    inputSchema: GenerateRepositorySummaryInputSchema,
    outputSchema: GenerateRepositorySummaryOutputSchema,
  },
  async input => {
    const {output} = await generateRepositorySummaryPrompt(input);
    return output!;
  }
);
