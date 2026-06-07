'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { submitFlashcardReviewAction } from '@/app/actions/fsrs';

export default function FlashcardReview({ initialDue }) {
  const [cards, setCards] = useState(initialDue);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done || cards.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-lg font-medium">No cards due right now.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Come back later — your schedule will tell you when.
          </p>
        </CardContent>
      </Card>
    );
  }

  const current = cards[index];
  const progressPct = Math.round(((index + 1) / cards.length) * 100);

  const submit = (rating) => {
    startTransition(async () => {
      try {
        await submitFlashcardReviewAction(current.reviewId, rating);
        setFlipped(false);
        if (index + 1 >= cards.length) {
          setDone(true);
        } else {
          setIndex(index + 1);
        }
      } catch (err) {
        toast.error('Failed to save review. Please try again.');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Progress value={progressPct} className="flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {index + 1} / {cards.length}
        </span>
      </div>

      <Card
        className="cursor-pointer min-h-[200px] flex items-center justify-center"
        onClick={() => setFlipped(!flipped)}
      >
        <CardContent className="p-8 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            {flipped ? 'Back' : 'Front'} — click to flip
          </p>
          <p className="text-lg">{flipped ? current.card.back : current.card.front}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        <Button variant="outline" disabled={pending} onClick={() => submit(1)}>
          Again
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => submit(2)}>
          Hard
        </Button>
        <Button variant="default" disabled={pending} onClick={() => submit(3)}>
          Good
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => submit(4)}>
          Easy
        </Button>
      </div>
    </div>
  );
}
