# AGENTS.md

## Quick Reference

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (catches type errors)
npm run lint         # ESLint
npm run db:push      # Push Drizzle schema to Neon
npm run db:studio    # Open Drizzle Studio GUI
```

## Architecture

Next.js 15 App Router + Drizzle ORM + Neon PostgreSQL + Clerk auth + Gemini AI.

### Directory Structure

| Path                | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `app/`              | App Router pages, server actions, API routes                 |
| `app/actions/`      | Server actions (`"use server"`) for DB mutations             |
| `app/api/`          | API routes (search, inngest, health, transcribe, verify)     |
| `app/_components/`  | Shared UI components (`.jsx` files)                          |
| `server/db/`        | Drizzle schema (`schema.ts`) and DB client (`index.ts`)      |
| `server/ai/`        | AI generation functions, schemas, and multi-agent system     |
| `server/ai/agents/` | Curriculum designer, fact checker, pedagogical expert        |
| `server/services/`  | External service integrations (vector, cache, storage, etc.) |
| `components/ui/`    | shadcn/ui components                                         |
| `configs/`          | Legacy Gemini chat configs (being phased out)                |

### Key Files

- `server/db/schema.ts` — All Drizzle table definitions and TypeScript interfaces
- `server/ai/schemas.ts` — Zod schemas for AI-generated content (quiz, flashcards, etc.)
- `server/ai/models.ts` — AI model factory (defaults to `gemini-1.5-flash`)
- `middleware.js` — Clerk auth middleware (protects `/dashboard` routes)

## Code Conventions

- **Mixed file extensions**: Pages in `app/` use `.jsx`, server code in `server/` uses `.tsx`. Follow the existing pattern per directory.
- **Server Actions**: All DB mutations go through `app/actions/*.ts` with `"use server"` directive. Always call `await auth()` from `@clerk/nextjs/server` for user context.
- **AI generation**: Uses Vercel AI SDK's `generateObject()` with Zod schemas from `server/ai/schemas.ts`. Do NOT use raw Gemini SDK for new code.
- **Styling**: Tailwind CSS utility classes + shadcn/ui. Dark mode via `dark:` prefix.
- **Path alias**: `@/*` maps to project root (configured in `tsconfig.json`).

## Database

Schema lives in `server/db/schema.ts`. After any schema change:

```bash
npm run db:push    # Pushes changes to Neon PostgreSQL
```

Key tables: `CourseList`, `chapters`, `quizzes`, `flashcards`, `study_notes`, `user_progress`, `course_ratings`.

## Background Jobs

Inngest handles async work (course generation, graph building). Functions registered in `app/api/inngest/route.ts`.

- Course generation uses a multi-agent pipeline: curriculum designer → fact checker → pedagogical expert → chapter content generation
- Events: `course.generate`, `course.build_graph`, `course.reindex_vectors`

## Optional Services

These are all optional — the app runs without them (graceful fallback):

| Service        | Env Var                         | Purpose                              |
| -------------- | ------------------------------- | ------------------------------------ |
| Upstash Vector | `UPSTASH_VECTOR_REST_URL/TOKEN` | Semantic search                      |
| Upstash Redis  | `UPSTASH_REDIS_REST_URL/TOKEN`  | Caching                              |
| Neo4j          | `NEO4J_URI/NEO4J_PASSWORD`      | Knowledge graph                      |
| Fal.ai         | `FAL_KEY`                       | AI banner/illustration generation    |
| AssemblyAI     | `ASSEMBLYAI_API_KEY`            | Audio transcription                  |
| ElevenLabs     | `ELEVENLABS_API_KEY`            | Text-to-speech                       |
| Cloudinary     | `CLOUDINARY_*`                  | Image uploads (or use local storage) |

## Gotchas

- The `configs/AiModel.jsx` file uses legacy `@google/generative-ai` SDK. New AI code should use `server/ai/models.ts` which uses `@ai-sdk/google`.
- `courseId` format is `course_{timestamp}_{random}` — generated in `app/actions/course.ts`.
- Auth checks use Clerk's `auth()` which returns `userId`. Most actions also fetch the user's email via `clerkClient().users.getUser()` for ownership checks.
- The app mixes `.jsx` and `.tsx` — don't "fix" this, follow the pattern of the directory you're editing.
- `revalidatePath()` is called after most mutations to trigger Next.js ISR cache invalidation.
