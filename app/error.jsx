'use client';

export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h2 className="text-2xl font-bold text-destructive">Something went wrong!</h2>
      <p className="text-gray-500">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
