'use client';
import { motion } from 'framer-motion';
import SectionWrapper from './SectionWrapper';

const steps = [
  {
    step: '01',
    title: 'Choose Topic',
    description: 'Select a category and enter your course idea. Our AI understands your vision.',
  },
  {
    step: '02',
    title: 'AI Generates',
    description: 'Watch as AI creates quizzes, flashcards, notes, and course structure.',
  },
  {
    step: '03',
    title: 'Publish & Share',
    description: 'Edit, customize, and share your course with the world.',
  },
];

export default function HowItWorks() {
  return (
    <SectionWrapper id="how-it-works" className="bg-gray-50 dark:bg-gray-900">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Create Courses in 3 Simple Steps
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
          From idea to published course in minutes. No technical skills required.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 relative">
        {/* Connecting line */}
        <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200 dark:from-purple-800 dark:via-pink-800 dark:to-indigo-800" />

        {steps.map((step, index) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            className="relative text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold relative z-10">
              {step.step}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
