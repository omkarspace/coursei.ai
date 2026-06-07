import { getCourseRatings } from '@/app/actions/rating';
import { HiStar, HiOutlineStar } from 'react-icons/hi2';

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString();
}

function maskUserId(userId) {
  if (!userId || userId.length < 4) return 'User';
  return `User •••·${userId.slice(-4)}`;
}

export default async function ReviewsList({ courseId }) {
  const ratings = await getCourseRatings(courseId);

  if (!ratings || ratings.length === 0) {
    return (
      <section className="space-y-3">
        <h3 className="font-bold text-lg dark:text-white">Reviews</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No reviews yet — be the first to rate this course.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h3 className="font-bold text-lg dark:text-white">Reviews</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({ratings.length})
        </span>
      </div>
      <ul className="space-y-4">
        {ratings.map((rating) => (
          <li
            key={rating.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex" aria-label={`${rating.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) =>
                    star <= rating.rating ? (
                      <HiStar key={star} className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                    ) : (
                      <HiOutlineStar
                        key={star}
                        className="w-4 h-4 text-gray-300 dark:text-gray-600"
                        aria-hidden="true"
                      />
                    )
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {maskUserId(rating.userId)}
                </span>
              </div>
              <time
                dateTime={new Date(rating.createdAt).toISOString()}
                className="text-xs text-gray-400 dark:text-gray-500"
              >
                {formatRelativeTime(new Date(rating.createdAt))}
              </time>
            </div>
            {rating.review && (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {rating.review}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
