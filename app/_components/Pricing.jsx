'use client';
import { motion } from 'framer-motion';
import { HiCheck } from 'react-icons/hi2';
import SectionWrapper from './SectionWrapper';
import { Card } from '@/components/ui/card';

const plans = [
  {
    name: 'Open Source',
    price: 'Free',
    description: 'Self-host and customize',
    features: [
      'Unlimited courses',
      'AI quiz generation',
      'AI flashcards',
      'AI study notes',
      'Course forking',
      'Community marketplace',
      'Full source code',
    ],
    cta: 'Get Started',
    href: 'https://github.com/omkarspace/coursei.ai',
    highlighted: false,
  },
  {
    name: 'Managed',
    price: '$9/mo',
    description: 'We handle hosting and maintenance',
    features: [
      'Everything in Open Source',
      'Managed hosting',
      'Custom domain',
      'Priority support',
      'Analytics dashboard',
      'Team collaboration',
      'SCORM export',
    ],
    cta: 'Coming Soon',
    href: '#',
    highlighted: true,
  },
];

export default function Pricing() {
  return (
    <SectionWrapper id="pricing" className="bg-white">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Simple{' '}
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Pricing
          </span>
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Start free, scale when ready. No hidden fees.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 }}
            className="relative"
          >
            <Card
              className={`p-8 h-full rounded-2xl ${
                plan.highlighted
                  ? 'border-purple-200 bg-gradient-to-b from-purple-50 to-white shadow-xl shadow-purple-100/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-full">
                  Recommended
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.price !== 'Free' && <span className="text-gray-500 ml-2">/month</span>}
                </div>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <HiCheck className="w-5 h-5 text-purple-500 shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                target={plan.href.startsWith('http') ? '_blank' : undefined}
                rel={plan.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`block w-full text-center py-3 rounded-full font-medium transition-all ${
                  plan.highlighted
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </a>
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
