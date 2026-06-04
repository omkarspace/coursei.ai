import neo4j, { Driver, Session } from "neo4j-driver";

const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

let driver: Driver | null = null;

function getDriver(): Driver | null {
  if (!NEO4J_URI || !NEO4J_PASSWORD) return null;
  if (!driver) {
    driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  }
  return driver;
}

function getSession(): Session | null {
  const d = getDriver();
  return d ? d.session() : null;
}

export interface ConceptNode {
  id: string;
  name: string;
  description: string;
  domain: string;
  difficulty: string;
}

export interface ConceptEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

export interface GraphSearchResult {
  concepts: ConceptNode[];
  relatedCourses: { courseId: string; name: string; relevance: number }[];
}

/**
 * Check if Neo4j is configured
 */
export function isKnowledgeGraphEnabled(): boolean {
  return !!(NEO4J_URI && NEO4J_PASSWORD);
}

/**
 * Upsert a concept node
 */
export async function upsertConcept(concept: ConceptNode): Promise<void> {
  const session = getSession();
  if (!session) return;

  try {
    await session.run(
      `MERGE (c:Concept {id: $id})
       SET c.name = $name, c.description = $description, c.domain = $domain, c.difficulty = $difficulty`,
      concept
    );
  } finally {
    await session.close();
  }
}

/**
 * Upsert a course node
 */
export async function upsertCourse(courseId: string, name: string, category: string, level: string): Promise<void> {
  const session = getSession();
  if (!session) return;

  try {
    await session.run(
      `MERGE (co:Course {id: $courseId})
       SET co.name = $name, co.category = $category, co.level = $level`,
      { courseId, name, category, level }
    );
  } finally {
    await session.close();
  }
}

/**
 * Link a course to its concepts
 */
export async function linkCourseToConcepts(courseId: string, conceptIds: string[]): Promise<void> {
  const session = getSession();
  if (!session) return;

  try {
    for (const conceptId of conceptIds) {
      await session.run(
        `MATCH (co:Course {id: $courseId}), (c:Concept {id: $conceptId})
         MERGE (co)-[:COVERS]->(c)`,
        { courseId, conceptId }
      );
    }
  } finally {
    await session.close();
  }
}

/**
 * Create concept relationships (prerequisite, related)
 */
export async function createConceptRelationship(
  sourceId: string,
  targetId: string,
  relationship: string,
  strength: number
): Promise<void> {
  const session = getSession();
  if (!session) return;

  try {
    const relType = relationship.toUpperCase().replace(/\s+/g, "_");
    await session.run(
      `MATCH (a:Concept {id: $sourceId}), (b:Concept {id: $targetId})
       MERGE (a)-[r:${relType}]->(b)
       SET r.strength = $strength`,
      { sourceId, targetId, strength }
    );
  } finally {
    await session.close();
  }
}

/**
 * Batch upsert concepts and relationships
 */
export async function buildCourseGraph(
  courseId: string,
  courseName: string,
  category: string,
  level: string,
  concepts: ConceptNode[],
  relationships: ConceptEdge[]
): Promise<void> {
  const session = getSession();
  if (!session) return;

  try {
    // Upsert course node
    await session.run(
      `MERGE (co:Course {id: $courseId})
       SET co.name = $name, co.category = $category, co.level = $level`,
      { courseId, name: courseName, category, level }
    );

    // Upsert concept nodes
    for (const concept of concepts) {
      await session.run(
        `MERGE (c:Concept {id: $id})
         SET c.name = $name, c.description = $description, c.domain = $domain, c.difficulty = $difficulty`,
        concept
      );
    }

    // Link course to concepts
    for (const concept of concepts) {
      await session.run(
        `MATCH (co:Course {id: $courseId}), (c:Concept {id: $conceptId})
         MERGE (co)-[:COVERS]->(c)`,
        { courseId, conceptId: concept.id }
      );
    }

    // Create relationships
    for (const rel of relationships) {
      const relType = rel.relationship.toUpperCase().replace(/\s+/g, "_");
      await session.run(
        `MATCH (a:Concept {id: $sourceId}), (b:Concept {id: $targetId})
         MERGE (a)-[r:${relType}]->(b)
         SET r.strength = $strength`,
        { sourceId: rel.source, targetId: rel.target, strength: rel.strength }
      );
    }
  } finally {
    await session.close();
  }
}

/**
 * Search for related concepts and courses
 */
export async function searchGraph(query: string, limit = 10): Promise<GraphSearchResult> {
  const session = getSession();
  if (!session) return { concepts: [], relatedCourses: [] };

  try {
    // Find concepts matching the query
    const conceptResult = await session.run(
      `MATCH (c:Concept)
       WHERE c.name CONTAINS $query OR c.description CONTAINS $query
       RETURN c.id as id, c.name as name, c.description as description,
              c.domain as domain, c.difficulty as difficulty
       LIMIT $limit`,
      { query, limit }
    );

    const concepts: ConceptNode[] = conceptResult.records.map((r) => ({
      id: r.get("id"),
      name: r.get("name"),
      description: r.get("description"),
      domain: r.get("domain"),
      difficulty: r.get("difficulty"),
    }));

    // Find courses that cover these concepts
    const conceptIds = concepts.map((c) => c.id);
    let relatedCourses: { courseId: string; name: string; relevance: number }[] = [];

    if (conceptIds.length > 0) {
      const courseResult = await session.run(
        `MATCH (co:Course)-[:COVERS]->(c:Concept)
         WHERE c.id IN $conceptIds
         RETURN co.id as courseId, co.name as name, COUNT(c) as relevance
         ORDER BY relevance DESC
         LIMIT $limit`,
        { conceptIds, limit }
      );

      relatedCourses = courseResult.records.map((r) => ({
        courseId: r.get("courseId"),
        name: r.get("name"),
        relevance: Number(r.get("relevance")),
      }));
    }

    return { concepts, relatedCourses };
  } finally {
    await session.close();
  }
}

/**
 * Get prerequisite chain for a concept
 */
export async function getPrerequisiteChain(conceptId: string, depth = 3): Promise<ConceptNode[]> {
  const session = getSession();
  if (!session) return [];

  try {
    const result = await session.run(
      `MATCH path = (pre:Concept)-[:PREREQUISITE_OF*1..${depth}]->(target:Concept {id: $conceptId})
       RETURN DISTINCT pre.id as id, pre.name as name, pre.description as description,
              pre.domain as domain, pre.difficulty as difficulty`,
      { conceptId }
    );

    return result.records.map((r) => ({
      id: r.get("id"),
      name: r.get("name"),
      description: r.get("description"),
      domain: r.get("domain"),
      difficulty: r.get("difficulty"),
    }));
  } finally {
    await session.close();
  }
}

/**
 * Close the driver connection
 */
export async function closeKnowledgeGraph(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
