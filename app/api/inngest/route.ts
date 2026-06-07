import { serve } from 'inngest/next';
import { inngest } from '@/server/services/inngest';
import { generateChapters } from '@/server/ai/generate-course';
import { reindexCourseVectors } from '@/server/ai/reindex-vectors';
import { buildCourseGraphFunction } from '@/server/ai/build-graph';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateChapters, reindexCourseVectors, buildCourseGraphFunction],
});
