import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getDueFlashcardsAction } from '@/app/actions/fsrs';
import FlashcardReview from '@/app/_components/FlashcardReview';
import Header from '@/app/dashboard/_components/Header';

export const metadata = { title: 'Review — coursei.ai' };

export default async function ReviewPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const due = await getDueFlashcardsAction();

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <Header />
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-1">Review</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Spaced repetition — see a card, recall the answer, then rate how well you knew it.
        </p>
        <FlashcardReview initialDue={due} />
      </div>
    </div>
  );
}
