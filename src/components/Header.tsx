import Link from 'next/link';
import { Code2 } from 'lucide-react';

export function Header() {
  return (
    <header className="p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <Code2 className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold font-headline tracking-tighter">
            GitGrade
          </span>
        </Link>
      </div>
    </header>
  );
}
