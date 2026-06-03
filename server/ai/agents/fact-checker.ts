import { generateObject } from "ai";
import { getModel } from "../models";
import { z } from "zod";
import type { CurriculumDesign, FactCheckResult } from "./types";

const CitationSchema = z.object({
  claim: z.string().describe("The claim being verified"),
  source: z.string().describe("Source used to verify (e.g., Wikipedia, official docs)"),
  reliable: z.boolean().describe("Whether the source confirms the claim"),
});

const FactCheckResultSchema = z.object({
  verified: z.boolean().describe("Overall verification status"),
  citations: z.array(CitationSchema).describe("Citations for verified claims"),
  flaggedIssues: z.array(z.string()).describe("Issues or inaccuracies found"),
  adjustedChapters: z
    .array(
      z.object({
        name: z.string(),
        about: z.string(),
        duration: z.string(),
        learningObjectives: z.array(z.string()),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        prerequisites: z.array(z.string()),
      })
    )
    .describe("Chapters with any necessary corrections applied"),
});

/**
 * Fact Checker Agent
 * Cross-references curriculum outline against reliable sources to verify accuracy.
 */
export async function checkFacts(
  curriculum: CurriculumDesign
): Promise<FactCheckResult> {
  const model = getModel("gemini-2.0-flash");

  const chapterSummaries = curriculum.course.chapters
    .map(
      (ch, i) =>
        `Chapter ${i + 1}: ${ch.name}\nDescription: ${ch.about}\nObjectives: ${ch.learningObjectives.join(", ")}`
    )
    .join("\n\n");

  const { object } = await generateObject({
    model,
    schema: FactCheckResultSchema,
    prompt: `You are an expert fact-checker for educational content. Review the following course curriculum for accuracy and completeness.

Course: ${curriculum.course.name}
Description: ${curriculum.course.description}

Chapters:
${chapterSummaries}

Tasks:
1. Verify that the chapter descriptions are factually accurate
2. Check that learning objectives are appropriate and achievable
3. Verify difficulty levels match the content complexity
4. Ensure prerequisites are logically ordered
5. Flag any claims that cannot be verified or are potentially misleading
6. Suggest corrections where needed

For each claim you verify, cite the source (e.g., "Official Next.js Documentation", "MDN Web Docs", "Wikipedia").
If everything is accurate, set verified to true and provide citations.
If issues are found, set verified to false, describe the issues, and provide corrected chapter data.

Generate the fact-check results in JSON format.`,
  });

  return object as FactCheckResult;
}
