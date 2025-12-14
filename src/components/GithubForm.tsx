'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Github, WandSparkles } from 'lucide-react';

const FormSchema = z.object({
  repoUrl: z.string().url({ message: 'Please enter a valid GitHub repository URL.' }).regex(/github\.com\/.+\/.+/, {
    message: 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo).',
  }),
});

export function GithubForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      repoUrl: '',
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    router.push(`/analysis?url=${encodeURIComponent(data.repoUrl)}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="repoUrl"
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  className="pl-10 h-12 text-base"
                  placeholder="https://github.com/your-username/your-repo"
                  {...field}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="w-full font-bold h-12" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Analyzing...' : <><WandSparkles className="mr-2" /> Analyze Repository</>}
        </Button>
      </form>
    </Form>
  );
}
