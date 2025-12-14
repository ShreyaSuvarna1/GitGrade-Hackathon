import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface SummaryCardProps {
  summary: string;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="text-accent" />
          AI Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg text-muted-foreground leading-relaxed">{summary}</p>
      </CardContent>
    </Card>
  );
}
