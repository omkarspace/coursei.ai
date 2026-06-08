'use client';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { HiOutlineSparkles, HiArrowRight } from 'react-icons/hi2';

const stats = [
  { value: '5min', label: 'Course Creation' },
  { value: 'AI', label: 'Powered Content' },
  { value: 'Free', label: 'Open Source' },
];

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const anim = prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 overflow-hidden pt-16">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 rounded-full opacity-[0.07] blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-10 md:px-12 lg:px-5 pt-20 sm:pt-28 pb-20">
        {/* Badge */}
        <motion.div
          {...anim}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 rounded-full text-sm text-purple-700 dark:text-purple-300">
            <HiOutlineSparkles className="w-4 h-4" aria-hidden="true" />
            <span>Open Source & Free</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...anim}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight max-w-5xl mx-auto"
        >
          The Open-Source Learning Platform{' '}
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            Powered by AI
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...anim}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          Create courses, quizzes, flashcards, and study notes in minutes. Fork, customize, and
          share with the community.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...anim}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10"
        >
          <Link
            href="https://github.com/omkarspace/coursei.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            Star on GitHub
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:shadow-lg hover:shadow-gray-900/20"
          >
            Try Free
            <HiArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </motion.div>

        {/* Product Demo Placeholder */}
        <motion.div
          {...anim}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 mx-auto max-w-4xl"
        >
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
            <div className="h-8 bg-gray-100 dark:bg-gray-800 flex items-center gap-2 px-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400 dark:text-gray-500">coursei.ai</span>
            </div>
            <div className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 min-h-[300px]">
              {/* Mock dashboard */}
              <div className="flex gap-4">
                {/* Sidebar */}
                <div className="w-48 space-y-3 hidden md:block">
                  <div className="h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg w-full" />
                  <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-lg w-3/4" />
                  <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-lg w-5/6" />
                  <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-lg w-2/3" />
                  <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-lg w-4/5" />
                </div>
                {/* Main content */}
                <div className="flex-1 space-y-4">
                  <div className="h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl w-48" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-24 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm" />
                    <div className="h-24 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm" />
                    <div className="h-24 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm" />
                  </div>
                  <div className="h-32 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-4">
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-gray-50 dark:bg-gray-600 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-50 dark:bg-gray-600 rounded w-5/6 mb-2" />
                    <div className="h-3 bg-gray-50 dark:bg-gray-600 rounded w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          {...anim}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-16"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
