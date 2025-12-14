'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a GitHub repository.
 *
 * It exports a single async function `analyzeRepository` which orchestrates the analysis.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Octokit } from 'octokit';

// Schemas are defined in this file to avoid circular dependencies.
// The types are exported from the actions file.
import type { AnalyzeRepositoryInput, AnalyzeRepositoryOutput } from '@/app/analysis/actions';

const AnalyzeRepositoryInputSchema = z.object({
  repoUrl: z.string().url(),
});

const RoadmapStepSchema = z.object({
  step: z.string().describe('The actionable step to improve the repository.'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the step.'),
  effortEstimate: z.string().describe('An estimate of the effort required to complete the step.'),
});

const AnalyzeRepositoryOutputSchema = z.object({
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
});


// Basic Octokit instance. For production, you'd want to use an authenticated client.
const octokit = new Octokit();

// Simple in-memory cache to avoid hitting rate limits during development.
const repoContentCache = new Map<string, any>();

// Helper to decode Base64 content
function fromBase64(content: string): string {
  try {
    return Buffer.from(content, 'base64').toString('utf-8');
  } catch (e) {
    console.error('Failed to decode base64 content', e);
    return '';
  }
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
      fileTree: z.string().optional().describe('A string representing the repository file tree, with each file on a new line.'),
    }),
  },
  async ({ repoUrl }) => {
    if (repoContentCache.has(repoUrl)) {
      return repoContentCache.get(repoUrl);
    }
    
    const urlMatch = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!urlMatch) {
      throw new Error('Invalid GitHub URL format. Expected format: https://github.com/owner/repo');
    }
    const repoPath = urlMatch[1];
    const [owner, repo] = repoPath.split('/');

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
      // The data type from getContent is complex, so we need to check if it's a file with content
      if (data && !Array.isArray(data) && 'content' in data) {
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


const analysisPrompt = ai.definePrompt({
  name: 'repositoryAnalysisPrompt',
  input: { schema: AnalyzeRepositoryInputSchema },
  output: { schema: AnalyzeRepositoryOutputSchema },
  tools: [fetchRepositoryContent],
  prompt: `You are an AI expert code reviewer and mentor. Your task is to analyze a GitHub repository and provide a comprehensive evaluation.

You must perform all of the following steps and return a single JSON object matching the full output schema:

1.  **Fetch Repository Content**: Use the 'fetchRepositoryContent' tool with the provided 'repoUrl' to get the repository's README, package.json, and file tree.

2.  **Analyze and Score**: Based on the fetched content, provide scores from 0 to 100 for each category in the 'analysis' object.
    -   **codeQuality**: Judge based on dependencies in package.json (are they modern?), presence of linting/testing scripts. If package.json is missing, score it low (e.g., 20).
    -   **projectStructure**: Based on the file tree, is it well-organized for a modern web project? (e.g., presence of src, components, etc.). If file tree is missing, score low (e.g., 20).
    -   **documentation**: How good is the README? Is it comprehensive and clear? If it's missing or very short, score it low (e.g., 10).
    -   **testCoverage**: Are there test scripts in package.json? Is a testing framework mentioned? Are there test files in the file tree (e.g., files ending in .test.js or .spec.ts)? If no tests are found, score this 0.
    -   **realWorldRelevance**: Based on the README description, does this project solve a real problem or is it just a demo/tutorial? If README is missing, make a best guess from other info or default to 50.
    -   **commitConsistency**: This is hard to determine without commit history. Provide a default score of 75 if other signals are positive, otherwise 50.

3.  **Calculate Overall Score**: In the 'score' object, calculate the 'numericalScore' as a weighted average of your analysis scores:
    -   Code Quality: 30%
    -   Project Structure: 20%
    -   Documentation: 15%
    -   Test Coverage: 15%
    -   Real-world Relevance: 10%
    -   Commit Consistency: 10%
    -   Then, determine the 'skillLevel' (Beginner: 0-50, Intermediate: 51-80, Advanced: 81-100) and 'badge' (Bronze: 0-40, Silver: 41-70, Gold: 71-100).

4.  **Generate Summary**: In the 'summary' object, write a concise 2-3 sentence 'summary' of the repository's main strengths and weaknesses based on your analysis.

5.  **Create Roadmap**: In the 'roadmap' object, generate a 'roadmap' with 3-5 actionable steps the developer can take to improve their repository. Each step must include a 'priority' (High, Medium, Low) and an 'effortEstimate' (e.g., "1 hour", "2 days").

If you cannot determine a score or information for a category (e.g., a file is missing), **do not ask for more information**. Provide a reasonable default score based on the rules above and proceed with the analysis. You must return the full JSON object.
`,
});

const analyzeRepositoryFlow = ai.defineFlow(
  {
    name: 'analyzeRepositoryFlow',
    inputSchema: AnalyzeRepositoryInputSchema,
    outputSchema: AnalyzeRepositoryOutputSchema,
  },
  async ({ repoUrl }) => {
    const { output } = await analysisPrompt({ repoUrl });
    if (!output) {
        throw new Error("Failed to get analysis from AI. The model did not return a valid output.");
    }
    // The repoUrl is NOT part of the AI output, so it's added back into the final object here.
    return { ...output, repoUrl };
  }
);

// This is the only export from this file. It's an async function that wraps the flow.
export async function analyzeRepository(input: AnalyzeRepositoryInput): Promise<AnalyzeRepositoryOutput> {
    return analyzeRepositoryFlow(input);
}
