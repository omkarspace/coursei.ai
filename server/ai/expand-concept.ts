import { generateObject } from "ai";
import { getModel } from "./models";
import { z } from "zod";

const ExpandedConceptSchema = z.object({
  concepts: z
    .array(
      z.object({
        name: z.string().describe("The concept name"),
        domain: z.string().describe("Subject domain"),
        difficulty: z.string().describe("Difficulty level"),
        relationship: z.string().describe("Relationship to parent concept"),
      })
    )
    .describe("Expanded sub-concepts"),
});

/**
 * Expand a concept into sub-topics using Gemini
 */
export async function expandConcept(
  courseName: string,
  parentConcept: string,
  courseCategory: string
): Promise<{ name: string; domain: string; difficulty: string; relationship: string }[]> {
  const model = getModel("gemini-2.0-flash");

  const { object } = await generateObject({
    model,
    schema: ExpandedConceptSchema,
    prompt: `You are an expert curriculum designer. Expand the following concept into 3-5 specific sub-topics that would make good learning modules.

Course: ${courseName}
Parent Concept: ${parentConcept}
Category: ${courseCategory}

Requirements:
- Each sub-concept should be specific enough to be a mini-lesson
- Sub-concepts should progress from simpler to more complex
- Include the relationship type (e.g., "contains", "breaks down into", "includes")
- Difficulty should be appropriate relative to the parent concept

Generate the expanded concepts in JSON format.`,
  });

  return object.concepts;
}
