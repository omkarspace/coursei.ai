import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { CourseList } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { expandConcept } from '@/server/ai/expand-concept';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const { conceptName, chapterIndex } = await request.json();

    if (!conceptName) {
      return NextResponse.json({ error: 'conceptName is required' }, { status: 400 });
    }

    // Get course data
    const courses = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
    const course = courses[0];

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Expand the concept
    const concepts = await expandConcept(course.name, conceptName, course.category);

    return NextResponse.json({ concepts });
  } catch (error) {
    console.error('Error expanding concept:', error);
    return NextResponse.json({ error: 'Failed to expand concept' }, { status: 500 });
  }
}
