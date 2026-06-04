import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <section className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <SignUp />
    </section>
  );
}
