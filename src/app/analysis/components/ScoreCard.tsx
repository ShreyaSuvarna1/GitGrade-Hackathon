'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Medal, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ScoreCardProps {
  score: number;
  badge: 'Bronze' | 'Silver' | 'Gold';
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

const badgeColors = {
  Bronze: 'text-[#cd7f32]',
  Silver: 'text-slate-400',
  Gold: 'text-yellow-400',
};

export default function ScoreCard({ score, badge, skillLevel }: ScoreCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timeout);
  }, [score]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Overall Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center flex-1">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full" viewBox="0 0 200 200">
            <circle
              className="text-muted/30"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="100"
              cy="100"
            />
            <circle
              className="text-primary"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="100"
              cy="100"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold font-headline text-accent">{score}</span>
            <span className="text-sm text-muted-foreground">out of 100</span>
          </div>
        </div>
        <div className="mt-6 text-center space-y-2">
            <div className={`flex items-center justify-center gap-2 text-xl font-semibold ${badgeColors[badge]}`}>
                <Medal className="h-6 w-6" />
                <span>{badge} Badge</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
                <Star className="h-5 w-5" />
                <span>{skillLevel} Level</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
