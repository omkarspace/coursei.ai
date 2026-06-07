import { auth } from '@clerk/nextjs/server';
import { HiFire } from 'react-icons/hi2';
import { getReviewStreakAction } from '@/app/actions/fsrs';

export default async function ReviewStreak() {
  const { userId } = await auth();
  if (!userId) return null;

  const streak = await getReviewStreakAction(userId);
  if (streak === 0) return null;

  return (
    <div
      className="flex items-center gap-2 mb-4 text-sm font-medium"
      aria-label={`Current review streak: ${streak} day${streak === 1 ? '' : 's'}`}
    >
      <HiFire className="h-4 w-4 text-orange-500" />
      <span>
        {streak} day{streak === 1 ? '' : 's'} streak
      </span>
    </div>
  );
}
