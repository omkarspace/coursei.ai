import { serve } from "inngest/next";
import { inngest } from "@/server/services/inngest";
import { generateCourse } from "@/server/ai/generate-course";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateCourse],
});
