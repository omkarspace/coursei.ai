import Link from 'next/link';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { getDueCountAction } from '@/app/actions/fsrs';
import { auth } from '@clerk/nextjs/server';

export default async function DueFlashcardCount() {
  const { userId } = await auth();
  if (!userId) return null;

  const count = await getDueCountAction(userId);
  if (count === 0) return null;

  return (
    <Link
      href="/review"
      className="flex items-center gap-3 p-4 mb-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
    >
      <HiOutlineAcademicCap className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <p className="text-sm font-medium">
          {count} {count === 1 ? 'card' : 'cards'} due for review
        </p>
        <p className="text-xs text-muted-foreground">Keep your streak going</p>
      </div>
    </Link>
  );
}
