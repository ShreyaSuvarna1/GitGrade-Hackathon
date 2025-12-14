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
import { Octokit } from 'octokit';

// Basic Octokit instance. For production, you'd want to use an authenticated client.
const octokit = new Octokit();

// Simple in-memory cache to avoid hitting rate limits during development.
const repoContentCache = new Map<string, any>();

// Helper to decode Base64 content
function fromBase64(content: string): string {
  return Buffer.from(content, 'base64').toString('utf-8');
}

// Define a tool for fetching repository content
const fetchRepositoryContent = ai.defineTool(
  {
    name: 'fetchRepositoryContent',
    description: 'Fetches content from a GitHub repository, like README, package.json, and file tree.',
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
    if (repoContentCache.has(repoUrl)) {
      return repoContentCache.get(repoUrl);
    }
    
    const urlMatch = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!urlMatch) {
      throw new Error('Invalid GitHub URL format.');
    }
    const [owner, repo] = urlMatch[1].split('/');

    let readme: string | undefined;
    let packageJson: string | undefined;
    let fileTree: string | undefined;

    // Fetch README
    try {
      const { data } = await octokit.rest.repos.getReadme({ owner, repo });
      if ('content' in data) {
        readme = fromBase64(data.content);
      }
    } catch (e) {
      console.warn(`Could not fetch README for ${owner}/${repo}. It might not exist.`);
    }
    
    // Fetch package.json
    try {
      const { data } = await octokit.rest.repos.getContent({ owner, repo, path: 'package.json' });
      if (data && 'content' in data) {
        packageJson = fromBase64(data.content);
      }
    } catch (e) {
      console.warn(`Could not fetch package.json for ${owner}/${repo}. It might not exist.`);
    }

    // Fetch file tree
    try {
      const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
      const defaultBranch = repoData.default_branch;
      if (defaultBranch) {
        const { data: treeData } = await octokit.rest.git.getTree({
          owner,
          repo,
          tree_sha: defaultBranch,
          recursive: '1',
        });

        if (treeData.tree) {
          fileTree = treeData.tree.map(file => file.path).join('\n');
        }
      }
    } catch (e) {
      console.warn(`Could not fetch file tree for ${owner}/${repo}.`);
    }
    
    const result = { readme, packageJson, fileTree };
    repoContentCache.set(repoUrl, result);
    return result;
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

- codeQuality: Judge based on the dependencies in package.json (are they modern?), presence of linting or testing scripts. If package.json is missing, score it low.
- projectStructure: Based on the file tree, is it a well-organized for a modern web project?
- documentation: How good is the README? Is it comprehensive and clear? If it's missing or short, score it low.
- testCoverage: Are there test scripts in package.json? Is there a testing framework mentioned? Are there test files in the file tree? If no tests are found, score this low.
- realWorldRelevance: Based on the README description, does this project solve a real problem or is it just a demo?
- commitConsistency: (This is hard to determine without commit history). Provide a default score of 75 if other signals are positive, otherwise 50.

If you cannot determine a score for a category from the provided context (e.g., a file is missing), provide a reasonable default score and note the reason in your internal thoughts. Do not ask for more information.
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
