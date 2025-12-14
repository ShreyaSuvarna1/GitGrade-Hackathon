import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Gauge, Clock, Flag } from 'lucide-react';

type RoadmapStep = {
  step: string;
  priority: 'High' | 'Medium' | 'Low';
  effortEstimate: string;
};

interface RoadmapTableProps {
  roadmap: RoadmapStep[];
}

const priorityConfig: Record<RoadmapStep['priority'], { variant: 'destructive' | 'secondary' | 'outline', className: string }> = {
  High: { variant: 'destructive', className: 'bg-destructive/80 text-destructive-foreground' },
  Medium: { variant: 'secondary', className: 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30' },
  Low: { variant: 'outline', className: 'border-green-400/30 text-green-300' },
};


export default function RoadmapTable({ roadmap }: RoadmapTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalized Roadmap</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center"><CheckCircle2 className="mx-auto" /></TableHead>
              <TableHead>Improvement Step</TableHead>
              <TableHead className="text-center w-32"><Flag className="mx-auto"/></TableHead>
              <TableHead className="text-center w-32"><Clock className="mx-auto" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roadmap.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-medium">{item.step}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={priorityConfig[item.priority].variant} className={priorityConfig[item.priority].className}>{item.priority}</Badge>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{item.effortEstimate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
