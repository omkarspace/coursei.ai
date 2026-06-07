# AGENTS.md

## Quick Reference

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build; runs lint + tsc + next build (~28s)
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
npm test             # Vitest single run (10 files, 50 tests)
npm test -- __tests__/ai/fsrs.test.ts   # Single test file
npm run db:push      # drizzle-kit push → Neon
npm run db:studio    # Drizzle Studio GUI
npm run format       # Prettier
```

Stack: Next.js 15 App Router · React 18 · Drizzle ORM · Neon PostgreSQL · Clerk auth · Google Gemini (Vercel AI SDK `ai@^6` + `@ai-sdk/google@^3`) · shadcn/ui (new-york, neutral base) · Tailwind 3.4 · Inngest · Vitest 4.

## Directory Map

| Path | Purpose |
| --- | --- |
| `app/` | App Router pages, server actions, API routes |
| `app/(auth)/sign-in/`, `sign-up/` | Clerk sign-in/up (route group) |
| `app/actions/*.ts` | Server actions — all `"use server"`, all DB mutations |
| `app/api/` | Route handlers: `search`, `transcribe`, `inngest`, `health`, `course/[id]/chat`, `course/[id]/status`, `canvas/[id]/expand` |
| `app/_components/` | Shared UI; mix of `.jsx` (simple) and `.tsx` (math/markdown/mermaid/code/progress) |
| `app/_context/`, `app/_shared/` | React context + cross-page constants |
| `app/course/[courseId]/` | Public viewer + `start/` (chapter reader) + `chat/` (RAG standalone) |
| `app/create-course/[courseId]/` | Wizard: `outline/` (review/edit) → page (chapter list) → `finish/` |
| `app/dashboard/` | User dashboard, `explore/` marketplace; `page.jsx` is a server component |
| `app/review/` | FSRS flashcard review session |
| `server/db/schema.ts` | All Drizzle tables + TS interfaces (CourseOutput, CardState, …) |
| `server/ai/` | Generation, schemas, models, FSRS; `agents/` has curriculum/fact/pedagogy |
| `server/services/` | External integrations: cache, vector, storage, fal, inngest, tts, transcription, wikipedia, youtube, neo4j, verification, audio-stream |
| `lib/` | `env.ts` (Zod env validation, runs on import), `utils.ts` (cn helper) |
| `components/ui/` | shadcn/ui primitives |
| `__tests__/` | Vitest suites: `ai/`, `actions/`, `api/`, `lib/`, `services/` |
| `drizzle/` | Generated SQL migrations + meta |

## Key Files

- `lib/env.ts` — Zod-validated env; required: `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GEMINI_API_KEY`. Side-effect import from `app/layout.js:1` so the app crashes loudly at boot if a key is missing.
- `server/ai/models.ts` — `getModel(name?)` factory. Default `gemini-1.5-flash` via `@ai-sdk/google`. All AI calls go through this; never use the raw `@google/generative-ai` SDK.
- `server/ai/schemas.ts` — Zod schemas for AI-generated content (quiz, flashcards, study notes).
- `server/ai/fsrs.ts` — FSRS-4.1 spaced-repetition algorithm (pure TS, no deps). Use the `w(i)` helper, not `W[i]` directly (see Gotchas).
- `app/api/inngest/route.ts` — Registers Inngest functions. Current set: `generateChapters`, `reindexCourseVectors`, `buildCourseGraphFunction`.
- `middleware.js` — Clerk `clerkMiddleware`; only `/dashboard(.*)` is protected.

## Conventions

**File extensions.** Pages and most components in `app/` are `.jsx` even when they have hooks/state. Use `.tsx` only when complex types are involved (`MarkdownRenderer.tsx`, `MermaidDiagram.tsx`, `MathFormula.tsx`, `CodeEditor.tsx`, `ProgressIndicator.tsx`, `VerifiedBadge.tsx`, `GenerationProgress.tsx`). Server code in `server/` is `.tsx`; server actions in `app/actions/` are `.ts`. Do not "normalize" the mix.

**Server actions** live in `app/actions/*.ts` with `"use server"`. Standard shape:

```ts
async function getUserEmail() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const user = await (await clerkClient()).users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('No email found');
  return email;
}
```

Always call `await auth()` and (for ownership) `getUserEmail()`. Mutations must call `revalidatePath(...)` for every route that displays the changed data (see `app/actions/course.ts` for the full list: `/dashboard`, `/dashboard/explore`, `/course/[id]`, `/course/[id]/start`).

**AI generation.** Use Vercel AI SDK's `generateObject()` with a Zod schema from `server/ai/schemas.ts`, or `streamText()` for the chat endpoint. Pass `getModel('gemini-1.5-flash')` (or `gemini-2.0-flash` for the multi-agent pipeline in `server/ai/agents/*`).

**Styling.** Tailwind utility classes + shadcn/ui. Dark mode via `dark:` prefix. Toast via `sonner`'s `Toaster` in `app/layout.js`. Icons: `lucide-react` or `react-icons/hi2` (mixed — check sibling files first).

**Path alias.** `@/*` → repo root (in `tsconfig.json`).

## Database

Schema: `server/db/schema.ts`. Tables: `CourseList`, `Chapters`, `Quizzes`, `Flashcards`, `FlashcardReviews` (FSRS), `StudyNotesTable`, `UserProgress`, `CourseRatings`.

`courseId` is generated client-side with `uuid4()` (e.g. `app/create-course/page.jsx`). It is the business key (unique on `CourseList`), not a numeric id.

`CourseStatus`: `draft | generating_outline | outline_ready | generating_chapters | complete | failed`. The pipeline is now **two-step**: `generateOutlineAction` (sync, ~15-30s, sets `outline_ready`) → user reviews in `/create-course/[id]/outline` → `course.generate_chapters` Inngest event generates content (`complete`).

After any schema change: `npm run db:push`. Migrations land in `drizzle/`.

## Background Jobs

Inngest client in `server/services/inngest.ts` (`id: 'coursei-ai'`). Active events:

- `course.generate_chapters` — handler in `server/ai/generate-course.ts` → `generateChapters`
- `course.reindex_vectors` — handler in `server/ai/reindex-vectors.ts`
- `course.build_graph` — handler in `server/ai/build-graph.ts`

The legacy `course.generate` event is gone — do not re-introduce.

## Optional Services

App runs without any of these; `lib/env.ts:isServiceEnabled(name)` is the gate. Patterns check both URL+TOKEN to avoid half-config.

| Service | Env vars | Purpose |
| --- | --- | --- |
| Upstash Vector | `UPSTASH_VECTOR_REST_URL` + `_TOKEN` | Semantic search |
| Upstash Redis | `UPSTASH_REDIS_REST_URL` + `_TOKEN` | Cache (`getCachedCourse`/`setCachedCourse`/`invalidateCourseCache`) |
| Neo4j | `NEO4J_URI` + `NEO4J_PASSWORD` (+ `NEO4J_USER`) | Knowledge graph |
| Fal.ai | `FAL_KEY` | AI banner + chapter illustrations |
| Tavily | `TAVILY_API_KEY` | Fact verification |
| AssemblyAI | `ASSEMBLYAI_API_KEY` | Audio transcription |
| ElevenLabs | `ELEVENLABS_API_KEY` | TTS |
| Cloudinary | `CLOUDINARY_CLOUD_NAME` + `_API_KEY` + `_API_SECRET` (+ `NEXT_PUBLIC_CLOUDINARY_*` for client uploads) | Image storage (`STORAGE_PROVIDER=cloudinary`); default is local |

## Tests

Vitest 4 with `jsdom` env, globals on, setup at `__tests__/setup.ts` (just `@testing-library/jest-dom`). Match pattern: `__tests__/**/*.test.{ts,tsx}`.

Mocking pattern for server actions and API routes:

```ts
vi.mock('@/server/db', () => ({
  db: { select: vi.fn().mockReturnThis(), from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), /* ... */ },
}));
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
  clerkClient: vi.fn().mockResolvedValue({ users: { getUser: vi.fn().mockResolvedValue({ emailAddresses: [{ emailAddress: 'a@b.com' }] }) } }),
}));
```

The chainable `mockReturnThis()` only works when the consumer awaits a single terminal. When a function issues multiple `db.select()` calls (e.g. the chat route does CourseList + Chapters + Quizzes + Flashcards), switch to `mockImplementation` with a call counter. See `__tests__/api/chat.test.ts:60-91` for the canonical example.

Each test file sets the four required env vars in `beforeEach` so `lib/env.ts` (side-effect import) doesn't throw on module load.

## Gotchas

- `noUncheckedIndexedAccess: true` is on (`tsconfig.json`). Array access is `T | undefined`. Destructure (`const [w0, w1] = W`) or use a helper like `w(i)` in `server/ai/fsrs.ts`. Direct `W[6]` won't compile.
- `lib/env.ts` runs `validateEnv()` at module load (line 192). Any test file that imports anything from `app/` or `lib/` indirectly triggers env validation — set the four required vars in `beforeEach` or `setupFiles`.
- The Zod schema in `lib/env.ts` is `.passthrough()`, so unknown env vars don't break, but `isServiceEnabled` is the right gate inside service files.
- `npm run build` is the de-facto type check (it runs `tsc` as part of `next build`). There is no separate `typecheck` script in `package.json`. CI runs `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` as four separate jobs (`.github/workflows/ci.yml`).
- `next lint` prints a deprecation warning on Next 16. Lint config is `eslint.config.mjs` (flat config via `@eslint/eslintrc` compat shim).
- Inngest functions use `step.run(...)`; each step persists and the function resumes on failure. Don't put non-step DB writes at the top level.
- `app/api/course/[courseId]/chat/route.ts` is a streaming endpoint using `streamText()` → `toUIMessageStreamResponse()` consumed by `useChat` from `@ai-sdk/react@^3`. `@ai-sdk/react` is **not bundled with `ai`** — install it explicitly.
- Clerk email lookup is the canonical ownership check. The pattern `await (await clerkClient()).users.getUser((await auth()).userId!)` is everywhere; if you add a new action, copy it.
- PowerShell-only environment notes: no `&&` chain (use `; if ($?)`), no `rg` (use the `grep`/`glob` tools), wrap paths with brackets in single quotes for `git add`.
- The `.kilo/` and `.opencode/` directories at the repo root are agent workspace dirs, not user code — leave them alone.
- Build/test/lint transcripts (`build-output.txt`, `test-output.txt`, `lint-output.txt`) live in the root and are not in `.gitignore`. Delete them or add to `.gitignore` if they bother you.

## Verification Order

Before claiming a task complete: `npm run lint` → `npm test` → `npm run build`. All three must pass. `build` catches the most issues (types + lint + bundle).
