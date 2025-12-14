# **App Name**: GitGrade

## Core Features:

- Repository URL Input: Accepts a GitHub repository URL as input.
- GitHub API Data Fetch: Automatically fetches repository data using the GitHub API, including number of files, folder structure, code quality, README, test coverage, commit history, language usage, real-world applicability, and version control practices.
- Repository Evaluation: Analyzes and evaluates the repository based on code quality, project structure, documentation, test coverage, real-world relevance, and commit consistency.
- AI-Powered Code Analysis: Uses Claude AI API to intelligently analyze the repository and produce insights regarding areas for improvement.
- Score/Rating Generation: Generates a numerical score (0-100), skill level category (Beginner/Intermediate/Advanced), and badge (Bronze/Silver/Gold) based on the repository analysis.
- Written Summary Generation: Generates a short evaluation (2-3 sentences) summarizing the repository's current quality, using Claude as a tool to decide what pieces of information should be in the summary.
- Personalized Roadmap Generation: Generates a personalized roadmap with actionable steps (improve folder structure, add README, write tests, follow Git best practices, add CI/CD, optimize code) to improve the repository.  Each step includes a priority level and effort estimate, using Claude as a tool to decide what steps the developer must follow.
- Modern UI with Dark Theme: Show loading states during analysis and handle errors gracefully.  Visually appealing with animations and smooth transitions.

## Style Guidelines:

- Primary color: Deep purple (#6750A4) to evoke intelligence and a modern feel.
- Background color: Very dark gray (#121212) for a modern dark theme.
- Accent color: Violet (#D0BCFF) for highlighting scores and actionable steps.
- Body and headline font: 'Inter' sans-serif font known for its readability and modern aesthetic.
- Code font: 'Source Code Pro' for displaying code snippets.
- Use clean, line-based icons to represent various metrics and suggestions.
- Emphasize a clean, organized layout with clear sections for input, analysis results, and roadmap. Use cards to separate different components and maintain a visually appealing structure.
- Use subtle animations and transitions (e.g., fade-in effects, progress loaders) to provide a smooth and engaging user experience. Ensure animations do not distract from the core functionality.