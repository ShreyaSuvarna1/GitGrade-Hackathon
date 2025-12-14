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
const fetchRepositoryContent = ai.defineTool(
    {
        name: 'fetchRepositoryContent',
        description: 'Fetches content from a GitHub repository, like README, package.json, etc.',
        inputSchema: z.object({
            repoUrl: z.string().url().describe('The URL of the repository to fetch content from.'),
        }),
        outputSchema: z.object({
            readme: z.string().optional().describe('Content of README.md file.'),
            packageJson: z.string().optional().describe('Content of package.json file.'),
            fileTree: z.string().optional().describe('A string representing the repository file tree.'),
        }),
    },
    async ({ repoUrl }) => {
        // This is a placeholder. In a real app, you'd fetch this from the GitHub API.
        console.log(`Fetching content for ${repoUrl}`);
        return {
            readme: "This is a sample README for a project. It describes what the project does, how to install it, and how to use it.",
            packageJson: JSON.stringify({
                name: "sample-project",
                version: "1.0.0",
                dependencies: { "react": "18.0.0" },
                scripts: { test: "jest" },
            }),
            fileTree: `
/
├── src/
│   ├── components/
│   └── pages/
├── package.json
└── README.md
            `,
        };
    }
);


const AnalyzeRepositoryInputSchema = z.object({
    repoUrl: z.string().url(),
});
export type AnalyzeRepositoryInput = z.infer<typeof AnalyzeRepositoryInputSchema>;

const AnalysisResultSchema = z.object({
    codeQuality: z.number().min(0).max(100),
    projectStructure: z.number().min(0).max(100),
    documentation: z.number().min(0).max(100),
    testCoverage: z.number().min(0).max(100),
    realWorldRelevance: z.number().min(0).max(100),
    commitConsistency: z.number().min(0).max(100),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

const analysisPrompt = ai.definePrompt({
    name: 'repositoryAnalysisPrompt',
    input: { schema: z.object({ repoUrl: z.string().url() }) },
    output: { schema: AnalysisResultSchema },
    tools: [fetchRepositoryContent],
    prompt: `Analyze the GitHub repository at the URL {{repoUrl}} and provide scores from 0 to 100 for each category.

You must use the 'fetchRepositoryContent' tool to get information about the repository.

- codeQuality: Judge based on mentions of standards, linting, dependencies in package.json.
- projectStructure: Is the file tree well-organized for a web project?
- documentation: How good is the README? Is it comprehensive?
- testCoverage: Are tests mentioned in README or scripts in package.json?
- realWorldRelevance: Does the project seem useful based on its description?
- commitConsistency: (This is hard to determine. Provide a default score of 75 if other signals are positive, otherwise 50).

If you cannot determine a score for a category, provide a reasonable default.
`,
});


export const analyzeRepositoryFlow = ai.defineFlow(
    {
      name: 'analyzeRepositoryFlow',
      inputSchema: AnalyzeRepositoryInputSchema,
      outputSchema: AnalysisResultSchema,
    },
    async ({ repoUrl }) => {
        const { output } = await analysisPrompt({ repoUrl });
        return output!;
    }
  );

  
export async function runFullAnalysis(input: AnalyzeRepositoryInput) {
    const analysisResult = await analyzeRepositoryFlow(input);

    const summaryInput = {
        codeQuality: `Code quality scored ${analysisResult.codeQuality}/100.`,
        projectStructure: `Project structure scored ${analysisResult.projectStructure}/100.`,
        documentation: `Documentation scored ${analysisResult.documentation}/100.`,
        testCoverage: `Test coverage scored ${analysisResult.testCoverage}/100.`,
        realWorldRelevance: `Real-world relevance scored ${analysisResult.realWorldRelevance}/100.`,
        commitConsistency: `Commit consistency scored ${analysisResult.commitConsistency}/100.`,
    };

    const roadmapInput = {
        repositoryAnalysis: Object.entries(summaryInput).map(([key, value]) => `${key}: ${value}`).join('\n')
    };

    // Run all generations in parallel
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
        analysis: analysisResult, // Pass this through for potential debugging or detailed views
    };
}
