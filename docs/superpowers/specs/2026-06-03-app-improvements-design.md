# Coursei.ai Comprehensive Improvements Design

> **Goal:** Make Coursei.ai production-ready with tests, CI, code quality, environment validation, and missing product features — using a foundation-first approach.

**Approach:** Foundation First — build tests, TypeScript fixes, and CI before adding features.

**Tech Stack:** Vitest, React Testing Library, GitHub Actions, Prettier, Zod (env validation)

---

## Phase 1: Testing Foundation

### Framework

- **Vitest** — fast, ESM-native, TypeScript-first
- **React Testing Library** — component testing
- \*\*@testing-library/jest-dom` — DOM matchers

### Test Structure

```
__tests__/
  actions/          # Server action tests
  ai/               # AI generation + schema tests
  services/         # Service tests (mocked externals)
  components/       # Critical UI component tests
```

### Coverage Priority

1. `app/actions/course.ts` — DB mutations, auth checks, ownership validation
2. `app/actions/ai.ts` — AI generation wrappers
3. `server/ai/schemas.ts` — Zod schema validation
4. `server/ai/generate.ts` — AI generation functions
5. `server/services/cache.ts` — caching logic
6. `server/services/vector.ts` — vector search logic
7. Critical UI components (Navbar, CourseCard, Flashcards)

### Test Commands

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## Phase 2: TypeScript & Code Quality

### TypeScript Fixes

- Update `tsconfig.json` `include` to cover `.jsx` files
- Verify `strict: true` has no workarounds
- Add `noUncheckedIndexedAccess` for safer array/object access

### Legacy Code Cleanup

- Remove `configs/AiModel.jsx` — replace imports with `server/ai/models.ts`
- Update any components still importing from `configs/AiModel.jsx`

### Formatting

- Add Prettier with config:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5"
  }
  ```
- Add `.prettierignore` for `node_modules`, `.next`, `dist`

### Quality Scripts

```bash
npm run format        # Format all files
npm run format:check  # Check formatting
```

---

## Phase 3: CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

**Triggers:**

- Push to `main`
- All pull requests

**Jobs:**

1. `lint` — ESLint check
2. `typecheck` — TypeScript type check (`npx tsc --noEmit`)
3. `test` — Vitest test suite
4. `build` — Production build

**Matrix:** Node.js 20.x

### Future Additions (not in this plan)

- Vercel preview deployments
- Database migration checks
- Security scanning (CodeQL, Dependabot)

---

## Phase 4: Environment Validation

### Implementation

**File:** `lib/env.ts`

```typescript
// Validates required env vars at startup
// Throws clear error message if missing
// Logs warnings for optional vars
```

### Required Variables

- `DATABASE_URL` — Neon PostgreSQL connection
- `CLERK_SECRET_KEY` — Clerk auth
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk client
- `NEXT_PUBLIC_GEMINI_API_KEY` — Gemini AI

### Optional Variables (warn if missing)

- `UPSTASH_REDIS_REST_URL/TOKEN` — Caching
- `UPSTASH_VECTOR_REST_URL/TOKEN` — Vector search
- `NEO4J_URI/NEO4J_PASSWORD` — Knowledge graph
- `FAL_KEY` — Image generation
- `ASSEMBLYAI_API_KEY` — Transcription
- `ELEVENLABS_API_KEY` — TTS
- `CLOUDINARY_*` — Image uploads

### Integration

- Import in `app/layout.js` — runs before any page renders
- Fail fast with descriptive error message

---

## Phase 5: Product Features (Scaffolded)

### 5.1 Course Progress Tracking UI

- Dashboard displays completion percentage per course
- Shows last accessed timestamp
- Visual progress bar

### 5.2 Course Ratings Display

- Public course pages show average rating
- Rating count and distribution
- Authenticated users can submit ratings (already in schema)

### 5.3 Export to PDF/Markdown

- Client-side generation from chapter content
- PDF via `html2pdf.js` or `@react-pdf/renderer`
- Markdown via `react-markdown` + download

### 5.4 Search UI

- Debounced search input in explore page
- Results displayed as course cards
- Source indicator (vector/graph/text)

---

## Implementation Order

1. Phase 1: Testing foundation (Vitest setup + key tests)
2. Phase 2: TypeScript & code quality (tsconfig, prettier, cleanup)
3. Phase 3: CI/CD pipeline (GitHub Actions)
4. Phase 4: Environment validation (lib/env.ts)
5. Phase 5: Product features (scaffolded, one at a time)

Each phase is independently deployable and testable.

---

## Success Criteria

- [ ] All existing functionality passes tests
- [ ] CI runs on every PR and blocks merge on failure
- [ ] Missing env vars fail fast at startup
- [ ] No legacy `configs/AiModel.jsx` imports
- [ ] Consistent formatting via Prettier
- [ ] At least one product feature fully implemented
