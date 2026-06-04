import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { CourseList } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;

    const courses = await db
      .select({
        status: CourseList.status,
        progress: CourseList.progress,
        currentStep: CourseList.currentStep,
        generationError: CourseList.generationError,
      })
      .from(CourseList)
      .where(eq(CourseList.courseId, courseId))
      .limit(1);

    if (!courses[0]) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = courses[0];

    return NextResponse.json({
      status: course.status,
      progress: course.progress,
      currentStep: course.currentStep,
      generationError: course.generationError,
    });
  } catch (error) {
    console.error('Error fetching course status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
