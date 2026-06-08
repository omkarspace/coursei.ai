import { getDueQuizCountAction } from '@/app/actions/fsrs';

export default async function DueQuizCount() {
  let count = 0;
  try {
    count = await getDueQuizCountAction();
  } catch {
    // Non-fatal: not signed in or DB error
  }

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-xs font-medium">
        {count}
      </span>
      quiz questions due
    </div>
  );
}
