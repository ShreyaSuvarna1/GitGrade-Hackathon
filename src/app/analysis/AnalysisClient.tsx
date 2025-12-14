'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { AnalysisResult, analyzeRepository } from './actions';
import LoadingState from './components/LoadingState';
import ScoreCard from './components/ScoreCard';
import SummaryCard from './components/SummaryCard';
import RoadmapTable from './components/RoadmapTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, ExternalLink } from 'lucide-react';

export default function AnalysisClient() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get('url');

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!repoUrl) {
      setError('No repository URL provided. Please go back and enter a URL.');
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        // Artificial delay to showcase the loading animation
        await new Promise(resolve => setTimeout(resolve, 2500));
        const analysisData = await analyzeRepository({ repoUrl });
        setResult(analysisData);
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred.');
        console.error(e);
      }
    });
  }, [repoUrl]);

  if (isPending) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!result) {
    return null; // Or a "not found" state
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
       <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Analysis Complete</h1>
        <a 
          href={result.repoUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-muted-foreground hover:text-accent transition-colors inline-flex items-center gap-2 break-all"
        >
          {result.repoUrl}
          <ExternalLink className="h-4 w-4 shrink-0" />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
            <ScoreCard score={result.score.numericalScore} badge={result.score.badge} skillLevel={result.score.skillLevel} />
        </div>
        <div className="lg:col-span-2">
            <SummaryCard summary={result.summary.summary} />
        </div>
      </div>
      
      <div>
        <RoadmapTable roadmap={result.roadmap.roadmap} />
      </div>
    </div>
  );
}
