'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { submitRating, getUserCourseRating } from '@/app/actions/rating';
import { toast } from 'sonner';
import { HiOutlineStar, HiStar } from 'react-icons/hi2';

export default function RatingDialog({ courseId, children }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [existingRating, setExistingRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && courseId) {
      getUserCourseRating(courseId).then((r) => {
        if (r) {
          setExistingRating(r);
          setRating(r.rating);
          setReview(r.review || '');
        }
      });
    }
  }, [open, courseId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await submitRating(courseId, rating, review || undefined);
      toast.success(existingRating ? 'Rating updated!' : 'Rating submitted!');
      setOpen(false);
      setExistingRating(null);
      setRating(0);
      setReview('');
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existingRating ? 'Update Rating' : 'Rate this Course'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label id="rating-label">Your rating</Label>
            <div
              className="flex gap-1"
              role="radiogroup"
              aria-labelledby="rating-label"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="text-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  {star <= (hoveredRating || rating) ? (
                    <HiStar className="text-yellow-500" />
                  ) : (
                    <HiOutlineStar className="text-gray-300 dark:text-gray-600" />
                  )}
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-gray-500 ml-2 self-center">{rating}/5</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating-review">Review</Label>
            <Textarea
              id="rating-review"
              placeholder="Write a review (optional)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : existingRating ? 'Update' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
