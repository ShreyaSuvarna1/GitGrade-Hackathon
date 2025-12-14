'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a GitHub repository.
 *
 * - analyzeRepositoryFlow - A function that orchestrates the analysis of a repository.
 * - AnalyzeRepositoryInput - The input type for the analyzeRepositoryFlow function.
 * - AnalyzeRepositoryOutput - The return type for the analyzeRepositoryFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateRepositoryScore } from './generate-repository-score';
import { generateRepositorySummary } from './generate-repository-summary';
import { generatePersonalizedRoadmap } from './generate-personalized-roadmap';


// Define a tool for fetching repository content
const getRepositoryContent = ai.defineTool(
    {
      name: 'getRepositoryContent',
      description: 'Fetches the content of a file from a GitHub repository.',
      inputSchema: z.object({
        repoUrl: z.string().describe('The URL of the GitHub repository.'),
        filePath: z.string().describe('The path to the file within the repository.'),
      }),
      outputSchema: z.string(),
    },
    async ({ repoUrl, filePath }) => {
      // In a real implementation, you would use the GitHub API to fetch file content.
      // For this example, we will return a placeholder.
      return `Content of ${filePath} from ${repoUrl}`;
    }
);


const AnalyzeRepositoryInputSchema = z.object({
    repoUrl: z.string().url(),
});
export type AnalyzeRepositoryInput = z.infer<typeof AnalyzeRepositoryInputSchema>;

const AnalysisResultSchema = z.object({
    codeQuality: z.number(),
    projectStructure: z.number(),
    documentation: z.number(),
    testCoverage: z.number(),
    realWorldRelevance: z.number(),
    commitConsistency: z.number(),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

const AnalyzeRepositoryOutputSchema = z.object({
    analysis: AnalysisResultSchema
});
export type AnalyzeRepositoryOutput = z.infer<typeof AnalyzeRepositoryOutputSchema>;

export const analyzeRepositoryFlow = ai.defineFlow(
    {
      name: 'analyzeRepositoryFlow',
      inputSchema: AnalyzeRepositoryInputSchema,
      outputSchema: AnalysisResultSchema,
      tools: [getRepositoryContent]
    },
    async ({ repoUrl }) => {
        // This is a simplified analysis. A real implementation would be more complex.
        const readmeContent = await getRepositoryContent({ repoUrl, filePath: 'README.md' });
        
        const analysisPrompt = ai.definePrompt({
            name: 'repositoryAnalysisPrompt',
            input: { schema: z.object({ readme: z.string() }) },
            output: { schema: AnalysisResultSchema },
            prompt: `Analyze the repository based on the README content and provide scores.
            README: {{{readme}}}
            
            Based on the content, provide a score from 0-100 for each category.
            - codeQuality: Judge based on mentions of standards, linting, etc.
            - projectStructure: Is a structure described?
            - documentation: How good is this README?
            - testCoverage: Are tests mentioned?
            - realWorldRelevance: Does the project seem useful?
            - commitConsistency: (Cannot be determined from README, give a default score)
            `,
        });

        const { output } = await analysisPrompt({ readme: readmeContent });
        return output!;
    }
  );

  
export async function runFullAnalysis(input: AnalyzeRepositoryInput) {
    const analysisResult = await analyzeRepositoryFlow(input);

    const summaryInput = {
        codeQuality: 'Analysis of code quality from the repository.',
        projectStructure: 'Analysis of project structure from the repository.',
        documentation: 'Analysis of documentation from the repository.',
        testCoverage: 'Analysis of test coverage from the repository.',
        realWorldRelevance: 'Analysis of real-world relevance from the repository.',
        commitConsistency: 'Analysis of commit consistency from the repository.',
    };

    const roadmapInput = {
        repositoryAnalysis: Object.entries(summaryInput).map(([key, value]) => `${key}: ${value}`).join('\n')
    };

    const [score, summary, roadmap] = await Promise.all([
        generateRepositoryScore(analysisResult),
        generateRepositorySummary(summaryInput),
        generatePersonalizedRoadmap(roadmapInput),
    ]);

    return {
        score,
        summary,
        roadmap,
        repoUrl: input.repoUrl,
    };
}
