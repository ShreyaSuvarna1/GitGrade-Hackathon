import { Suspense } from 'react';
import AnalysisClient from './AnalysisClient';
import LoadingState from './components/LoadingState';

export default function AnalysisPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AnalysisClient />
    </Suspense>
  );
}
