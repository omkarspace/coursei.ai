import { serve } from "inngest/next";
import { inngest } from "@/server/services/inngest";
import { generateCourse } from "@/server/ai/generate-course";
import { reindexCourseVectors } from "@/server/ai/reindex-vectors";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateCourse, reindexCourseVectors],
});
