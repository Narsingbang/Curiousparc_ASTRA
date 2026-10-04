# Contributing to MediSync AI

Thank you for your interest in contributing to MediSync AI!

## Project Overview

MediSync AI is a full-stack platform providing real-time hospital resource coordination and AI-driven clinical symptom triage. Built with:
- **Client**: React 18, Vite, TypeScript, Tailwind CSS, Three.js / React Three Fiber, TanStack Query, Zustand.
- **Server**: Express.js on Node 20+, TypeScript, Pino, Zod validation, `@google/genai` (Gemini).
- **Database & Auth**: Supabase PostgreSQL, Row-Level Security, Supabase Realtime.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Narsingbang/Curiousparc_ASTRA.git
   cd Curiousparc_ASTRA
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase project credentials and Google Gemini API key.

4. **Run local development servers**
   ```bash
   npm run dev
   ```

## Verification & Code Quality

Before opening a pull request, ensure all quality gates pass:

```bash
# 1. TypeScript compilation check
npm run typecheck

# 2. Linting verification
npm run lint

# 3. Unit and integration tests
npm test

# 4. Secret leak check
npm run check:secrets

# 5. End-to-end verification suite
npm run verify
```

## Pull Request Guidelines

- Branch naming: `feature/<name>`, `fix/<issue>`, or `refactor/<name>`.
- Commit messages follow Conventional Commits (e.g. `feat: ...`, `fix: ...`, `docs: ...`).
- Never commit credentials, `.env` files, or patient data.
