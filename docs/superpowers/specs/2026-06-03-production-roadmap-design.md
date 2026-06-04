# Coursei.ai Production Roadmap — 5-Phase Design Spec

## Overview

Comprehensive production-grade upgrade for Coursei.ai across 5 phases: PPR + Redis Caching, Multi-Agent Workflows, GraphRAG with Neo4j, Live Audio Streaming, and Real-Time Canvas.

## Phase 1: PPR + Redis Caching

### Goal

Instant public course pages with near-zero TTFB via Partial Prerendering and intelligent caching.

### Architecture

**Next.js 15 PPR:**

- Enable `experimental.ppr = true` in `next.config.mjs`
- `app/course/[courseId]/page.jsx` uses `<Suspense>` boundaries
- Static shell (banner, title, structural layout) pre-rendered at build time
- Dynamic parts (ratings, fork status, chapter progress) stream in via React Suspense

**Cache-Aside Pattern via Upstash Redis:**

- `server/services/cache.ts` — generic Redis cache helpers with TTL + invalidation
- Cache keys: `course:{id}:meta` (1h TTL), `course:{id}:content` (6h TTL), `marketplace:list` (5m TTL)
- Invalidated on: course publish, course update, chapter content change
- Fallback: if Redis unavailable, serve from DB directly (no errors)

### Files

| Action | File                                                                        |
| ------ | --------------------------------------------------------------------------- |
| Create | `server/services/cache.ts`                                                  |
| Modify | `next.config.mjs` (enable PPR)                                              |
| Modify | `app/course/[courseId]/page.jsx` (Suspense boundaries)                      |
| Modify | `app/course/[courseId]/_components/CourseClient.jsx` (split dynamic/static) |
| Modify | `app/api/courses/route.ts` (cache marketplace list)                         |
| Modify | `app/actions/course.ts` (cache course metadata, invalidate on update)       |

### Data Flow

```
User Request → Edge (static shell) + Suspense → Dynamic parts stream in
                        ↓
              Redis Cache Check → Cache Hit? → Return cached
                        ↓
                   Cache Miss → Query Neon DB → Cache result → Return
```

### Error Handling

- Redis connection failure → graceful fallback to DB
- Cache corruption → delete key, re-fetch from DB
- Stale cache → TTL-based expiry, manual invalidation on writes

---

## Phase 2: Multi-Agent Workflows

### Goal

Replace single LLM course generation with specialized agent pipeline for deeper, hallucination-free courses.

### Architecture

**Three specialized Inngest step-function agents:**

1. **Curriculum Designer** (`server/ai/agents/curriculum-designer.ts`)
   - Input: topic, level, duration, numChapters
   - Output: structured chapter outline with learning objectives per chapter
   - Uses Gemini with structured output (Zod schema)

2. **Fact Checker** (`server/ai/agents/fact-checker.ts`)
   - Input: curriculum outline
   - Process: cross-references claims against Wikipedia API + Google Search API
   - Output: verified outline with source citations, flags for unverifiable claims
   - Uses existing `getVideos` (YouTube API) for additional verification

3. **Pedagogical Expert** (`server/ai/agents/pedagogical-expert.ts`)
   - Input: verified curriculum
   - Process: adjusts reading levels, adds code block placeholders, injects quiz ideas
   - Output: final course layout with difficulty tags, prerequisites, quiz prompts

**Orchestration:**

- `server/ai/generate-course.ts` calls agents sequentially via `step.run()`
- Each agent has independent retry logic (Inngest built-in)
- Progress updates streamed to UI via existing `CourseList.progress` field

### Files

| Action | File                                                                                |
| ------ | ----------------------------------------------------------------------------------- |
| Create | `server/ai/agents/curriculum-designer.ts`                                           |
| Create | `server/ai/agents/fact-checker.ts`                                                  |
| Create | `server/ai/agents/pedagogical-expert.ts`                                            |
| Create | `server/ai/agents/types.ts` (shared agent types)                                    |
| Modify | `server/ai/generate-course.ts` (use agents)                                         |
| Modify | `server/ai/schemas.ts` (extend CourseLayout with learningObjectives, verified flag) |

### Data Flow

```
User Request → Inngest Trigger
    ↓
Curriculum Designer → outline with learning objectives
    ↓
Fact Checker → verified outline with citations
    ↓
Pedagogical Expert → final course layout with quiz ideas
    ↓
Chapter Content Generation (existing)
    ↓
Complete
```

### Error Handling

- Agent failure → Inngest retry (3 attempts with exponential backoff)
- Partial failure → curriculum designer output cached, fact checker can resume
- Wikipedia/Google API down → fact checker returns outline with "unverified" flag

---

## Phase 3: GraphRAG with Neo4j

### Goal

Knowledge graph for conceptual search, prerequisite chains, and deeply connected course structures.

### Architecture

**Neo4j Graph Schema:**

```
(:Concept {id, name, description, domain, difficulty})
(:Course {id, name, category, level})
(:Chapter {id, name, courseId})
-[:RELATES_TO {relationship, strength}]->
(:Concept)
-[:PREREQUISITE_OF {strength}]->
(:Concept)
-[:BELONGS_TO]->
(:Course)
-[:CONTAINS]->
(:Chapter)
```

**Concept Extraction:**

- Inngest job `course.build_graph` fires on course publish
- Gemini extracts concepts and relationships from chapter content
- Batch upsert to Neo4j via driver

**Hybrid Search:**

- Vector search (existing) + graph traversal
- Query: find courses related to concept X → traverse graph to find prerequisite courses
- Search API returns: vector matches + graph-related concepts

**Course Generation Enhancement:**

- Graph traversal to find prerequisite chains for topic
- Inject prerequisite chapters automatically into curriculum

### Files

| Action | File                                                        |
| ------ | ----------------------------------------------------------- |
| Create | `server/services/knowledge-graph.ts` (Neo4j driver + CRUD)  |
| Create | `server/ai/extract-concepts.ts` (Gemini concept extraction) |
| Create | `server/ai/build-graph.ts` (Inngest job)                    |
| Modify | `app/api/search/route.ts` (hybrid search)                   |
| Modify | `server/ai/generate-course.ts` (graph-aware curriculum)     |
| Modify | `app/api/inngest/route.ts` (register build_graph function)  |

### Dependencies

- Neo4j AuraDB (free tier: 50,000 nodes, 175,000 relationships)
- `neo4j-driver` npm package (new dependency — only new infra in entire roadmap)

---

## Phase 4: Live Audio Streaming

### Goal

Transform static TTS into real-time conversational voice tutor.

### Architecture

**WebSocket Streaming:**

- `app/api/audio/stream/route.ts` — handles WebSocket upgrade
- `server/services/audio-stream.ts` — ElevenLabs WebSocket client
- Client sends user question → server streams back audio response

**AudioPlayer Upgrade:**

- Toggle between "Listen" (existing static TTS) and "Chat" (new live mode)
- Live mode: user types or speaks question → streamed audio response
- Uses `MediaSource` API for sub-500ms playback latency
- Fallback: if WebSocket fails, degrade to existing static TTS

**ElevenLabs WebSocket API:**

- Uses existing `elevenlabs` SDK (WebSocket support included)
- Streaming text-to-speech with chunked audio delivery
- Server-side: send text chunks as they're generated by Gemini

### Files

| Action | File                                              |
| ------ | ------------------------------------------------- |
| Create | `server/services/audio-stream.ts`                 |
| Create | `app/api/audio/stream/route.ts`                   |
| Modify | `app/_components/AudioPlayer.jsx` (add live mode) |
| Modify | `app/actions/audio.ts` (add streaming action)     |

### Dependencies

- No new packages — ElevenLabs SDK already installed
- Requires `ELEVENLABS_API_KEY` env var (already exists)

---

## Phase 5: Real-Time Canvas

### Goal

Interactive concept maps with expandable nodes for visual learning.

### Architecture

**React Flow Canvas:**

- `app/_components/ConceptCanvas.tsx` — interactive node-based graph
- Course chapters as nodes, prerequisites as edges
- Color-coded by difficulty level
- Click node → show chapter preview
- Double-click node → trigger Inngest background job to expand sub-topic

**Concept Expansion:**

- Inngest function `course.expand_concept` generates mini-chapter for sub-topic
- New child nodes appear in canvas with animation
- Canvas state saved to Redis per user session

**Canvas Layout:**

- Dagre layout algorithm (included in react-flow) for automatic graph layout
- Zoom, pan, minimap for navigation
- Responsive: works on mobile with touch gestures

### Files

| Action | File                                                                  |
| ------ | --------------------------------------------------------------------- |
| Create | `app/_components/ConceptCanvas.tsx`                                   |
| Create | `server/ai/expand-concept.ts` (Inngest function)                      |
| Create | `app/api/canvas/[courseId]/route.ts` (save/load state)                |
| Modify | `app/course/[courseId]/_components/CourseClient.jsx` (add canvas tab) |

### Dependencies

- `react-flow` (npm package — free, no infrastructure)
- Depends on Phase 3 (GraphRAG) for concept data

---

## Execution Order

```
Phase 1 (PPR + Cache) → Phase 2 (Multi-Agent) → Phase 3 (GraphRAG)
                                                        ↓
Phase 5 (Canvas) ← depends on Phase 3 ← ← ← ← ← ← ←
Phase 4 (Live Audio) — independent, parallel with Phase 3-5
```

## Estimated Effort

| Phase | Effort      | Risk                                       |
| ----- | ----------- | ------------------------------------------ |
| 1     | Low-Medium  | Low — PPR is well-documented               |
| 2     | Medium      | Low — Inngest handles orchestration        |
| 3     | High        | Medium — Neo4j setup + graph schema design |
| 4     | Medium-High | Medium — WebSocket streaming complexity    |
| 5     | Medium      | Low — React Flow is straightforward        |

## Success Metrics

| Phase | Metric                       | Target                                     |
| ----- | ---------------------------- | ------------------------------------------ |
| 1     | TTFB for public course pages | < 200ms                                    |
| 1     | Cache hit rate               | > 80% for popular courses                  |
| 2     | Course generation accuracy   | Measurably fewer hallucinations            |
| 2     | Generation time              | < 2x current time (acceptable for quality) |
| 3     | Search relevance             | Graph-augmented results rank higher        |
| 3     | Concept coverage             | > 90% of chapter content mapped to graph   |
| 4     | Audio latency                | < 500ms for streaming response             |
| 4     | User engagement              | > 30% of audio users try live mode         |
| 5     | Canvas interaction           | > 20% of users expand at least one node    |
