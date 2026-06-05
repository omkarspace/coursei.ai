'use client';
import { motion } from 'framer-motion';
import SectionWrapper from './SectionWrapper';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

export default function FAQ() {
  return (
    <SectionWrapper id="faq" className="bg-gray-50">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Everything you need to know about Coursei.ai
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <AccordionItem
                value={`item-${index}`}
                className="border border-gray-100 rounded-xl overflow-hidden px-5 bg-white"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-0 py-5 text-base font-medium text-gray-900">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </SectionWrapper>
  );
}
