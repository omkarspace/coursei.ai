'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiPlus, HiMinus } from 'react-icons/hi2';
import SectionWrapper from './SectionWrapper';

const faqs = [
  {
    question: 'What is Coursei.ai?',
    answer:
      'Coursei.ai is an AI-powered open-source learning platform that creates courses, quizzes, flashcards, and study notes in minutes. Fork it, customize it, and share with the community.',
  },
  {
    question: 'Is it really free?',
    answer:
      'Yes! The open-source version is completely free and self-hosted. You get unlimited courses, AI generation, and full source code access. We also offer a managed hosting option for $9/month.',
  },
  {
    question: 'How does the AI work?',
    answer:
      'We use Google Gemini 2.0 Flash as our AI engine. It generates course structures, quizzes, flashcards, and study notes from your input. You need a free Gemini API key to use the AI features.',
  },
  {
    question: 'Can I customize existing courses?',
    answer:
      'Absolutely! Coursei supports forking — like GitHub repos. Fork any public course, modify the content, add your own quizzes and flashcards, then publish your version.',
  },
  {
    question: 'What technologies does it use?',
    answer:
      'Next.js 15, Tailwind CSS, Drizzle ORM, Neon PostgreSQL, Clerk authentication, Firebase storage, and Vercel for deployment. All modern, battle-tested technologies.',
  },
  {
    question: 'How do I contribute?',
    answer:
      'Visit our GitHub repository to submit PRs, report bugs, suggest features, or join discussions. Every contribution — from code to documentation — is welcome.',
  },
];

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
        {isOpen ? (
          <HiMinus className="w-5 h-5 text-purple-500 shrink-0" />
        ) : (
          <HiPlus className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 text-gray-600 leading-relaxed">{faq.answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <SectionWrapper id="faq" className="bg-gray-50">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Everything you need to know about Coursei.ai
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((faq, index) => (
          <motion.div
            key={faq.question}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
          >
            <FAQItem
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
