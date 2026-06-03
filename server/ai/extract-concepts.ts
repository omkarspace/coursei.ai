import { generateObject } from "ai";
import { getModel } from "./models";
import { z } from "zod";
import type { ConceptNode, ConceptEdge } from "../services/knowledge-graph";

const ExtractedConceptSchema = z.object({
  name: z.string().describe("The concept name"),
  description: z.string().describe("Brief description of the concept"),
  domain: z.string().describe("Subject domain (e.g., 'web-development', 'algorithms', 'database')"),
  difficulty: z.string().describe("Difficulty level: beginner, intermediate, or advanced"),
});

const ConceptRelationshipSchema = z.object({
  source: z.string().describe("Source concept name"),
  target: z.string().describe("Target concept name"),
  relationship: z.string().describe("Relationship type: PREREQUISITE_OF, RELATES_TO, PART_OF, USES"),
  strength: z.number().min(0).max(1).describe("Relationship strength from 0 to 1"),
});

const ExtractionResultSchema = z.object({
  concepts: z.array(ExtractedConceptSchema).describe("Extracted concepts from the content"),
  relationships: z.array(ConceptRelationshipSchema).describe("Relationships between concepts"),
});

/**
 * Extract concepts and relationships from chapter content using Gemini
 */
export async function extractConceptsFromContent(
  courseName: string,
  chapterName: string,
  chapterContent: { title: string; explanation: string }[]
): Promise<{ concepts: ConceptNode[]; relationships: ConceptEdge[] }> {
  const model = getModel("gemini-2.0-flash");

  const contentText = chapterContent
    .map((s) => `${s.title}: ${s.explanation.substring(0, 500)}`)
    .join("\n\n");

  const { object } = await generateObject({
    model,
    schema: ExtractionResultSchema,
    prompt: `You are an expert at identifying key concepts and their relationships in educational content.

Course: ${courseName}
Chapter: ${chapterName}

Chapter Content:
${contentText}

Tasks:
1. Extract 5-15 key concepts from this chapter content
2. For each concept, provide a clear name, description, domain, and difficulty level
3. Identify relationships between concepts (prerequisites, related topics, etc.)
4. Ensure concepts are specific enough to be meaningful but general enough to connect across chapters

Domain should be one of: web-development, programming, algorithms, database, DevOps, design, security, data-science, mobile-development, cloud, testing, networking, or a custom domain.

Generate the extraction results in JSON format.`,
  });

  // Generate IDs from names
  const concepts: ConceptNode[] = object.concepts.map((c) => ({
    id: `concept:${courseName.toLowerCase().replace(/\s+/g, "-")}:${c.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: c.name,
    description: c.description,
    domain: c.domain,
    difficulty: c.difficulty,
  }));

  // Map relationship names to concept IDs
  const nameToId = new Map(concepts.map((c) => [c.name.toLowerCase(), c.id]));

  const relationships: ConceptEdge[] = object.relationships
    .filter((r) => nameToId.has(r.source.toLowerCase()) && nameToId.has(r.target.toLowerCase()))
    .map((r) => ({
      source: nameToId.get(r.source.toLowerCase())!,
      target: nameToId.get(r.target.toLowerCase())!,
      relationship: r.relationship,
      strength: r.strength,
    }));

  return { concepts, relationships };
}

/**
 * Extract cross-chapter concepts (concepts that span multiple chapters)
 */
export async function extractCrossChapterConcepts(
  courseName: string,
  chapters: { name: string; content: { title: string; explanation: string }[] }[]
): Promise<{ concepts: ConceptNode[]; relationships: ConceptEdge[] }> {
  const allConcepts: ConceptNode[] = [];
  const allRelationships: ConceptEdge[] = [];

  for (const chapter of chapters) {
    const { concepts, relationships } = await extractConceptsFromContent(
      courseName,
      chapter.name,
      chapter.content
    );
    allConcepts.push(...concepts);
    allRelationships.push(...relationships);
  }

  // Deduplicate concepts by name
  const seen = new Set<string>();
  const uniqueConcepts: ConceptNode[] = [];
  for (const c of allConcepts) {
    const key = c.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueConcepts.push(c);
    }
  }

  // Deduplicate relationships
  const relSeen = new Set<string>();
  const uniqueRelationships: ConceptEdge[] = [];
  for (const r of allRelationships) {
    const key = `${r.source}-${r.relationship}-${r.target}`;
    if (!relSeen.has(key)) {
      relSeen.add(key);
      uniqueRelationships.push(r);
    }
  }

  return { concepts: uniqueConcepts, relationships: uniqueRelationships };
}
