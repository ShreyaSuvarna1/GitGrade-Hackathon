import { GithubForm } from '@/components/GithubForm';
import { Header } from '@/components/Header';
import { Github } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl text-center animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-primary via-accent to-purple-400">
            Welcome to GitGrade
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
            Your AI coding mentor. Get instant feedback on your GitHub repositories, from code quality to project structure, and receive a personalized roadmap to level up your skills.
          </p>
          <div className="mt-8 sm:mt-12">
            <GithubForm />
          </div>
        </div>
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>Built for the Hackathon. <a href="https://github.com/google/genkit" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">Powered by AI and <Github className="size-4" /></a></p>
      </footer>
    </div>
  );
}
