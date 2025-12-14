import { config } from 'dotenv';
config();

import '@/ai/flows/generate-repository-score.ts';
import '@/ai/flows/generate-repository-summary.ts';
import '@/ai/flows/generate-personalized-roadmap.ts';
import '@/ai/flows/analyze-repository-flow.ts';
