'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a GitHub repository.
 *
 * - analyzeRepositoryFlow - A function that orchestrates the analysis of a repository.
 * - AnalyzeRepositoryInput - The input type for the analyzeRepositoryFlow function.
 * - AnalysisResult - The return type for the analyzeRepositoryFlow function.
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
      readme: `# Sample Project

This is a sample README for a project created with Next.js and Tailwind CSS.

## Features
- React
- Next.js
- Tailwind CSS

## Getting Started

First, run the development server:

\'\'\'bash
npm run dev
\'\'\'
`,
      packageJson: JSON.stringify({
        name: 'sample-project',
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
          test: 'jest',
        },
        dependencies: {
          next: '14.2.3',
          react: '18.3.1',
          'react-dom': '18.3.1',
        },
        devDependencies: {
          '@types/node': '20.12.2',
          '@types/react': '18.2.73',
          eslint: '8.57.0',
          'eslint-config-next': '14.2.3',
          jest: '29.7.0',
          typescript: '5.4.3',
        },
      }),
      fileTree: `
/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   └── lib/
├── public/
├── package.json
├── next.config.js
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
  prompt: `You are an expert code reviewer. Analyze the GitHub repository at the URL {{repoUrl}} and provide scores from 0 to 100 for each category.

You must use the 'fetchRepositoryContent' tool to get information about the repository. Base your analysis on the content provided by the tool.

- codeQuality: Judge based on the dependencies in package.json (are they modern?), presence of linting or testing scripts.
- projectStructure: Based on the file tree, is it a well-organized for a modern web project?
- documentation: How good is the README? Is it comprehensive and clear?
- testCoverage: Are there test scripts in package.json? Is there a testing framework mentioned? If no tests are found, score this low.
- realWorldRelevance: Based on the README description, does this project solve a real problem or is it just a demo?
- commitConsistency: (This is hard to determine without commit history). Provide a default score of 75 if other signals are positive, otherwise 50.

If you cannot determine a score for a category from the provided context, provide a reasonable default based on the information you do have. Do not ask for more information.
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
    if (!output) {
        throw new Error("Failed to get analysis from AI");
    }
    return output;
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
    repositoryAnalysis: Object.entries(summaryInput)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n'),
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
    analysis: analysisResult,
  };
}
