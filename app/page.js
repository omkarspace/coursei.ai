import Navbar from './_components/Navbar';
import Hero from './_components/Hero';
import Features from './_components/Features';
import HowItWorks from './_components/HowItWorks';
import TechnicalArchitecture from './_components/TechnicalArchitecture';
import Community from './_components/Community';
import Pricing from './_components/Pricing';
import FAQ from './_components/FAQ';
import Footer from './_components/Footer';

export const metadata = {
  metadataBase: new URL('https://coursei.ai'),
  title: {
    default: 'Coursei.ai | AI-Powered Open-Source Learning Platform',
    template: '%s | Coursei.ai',
  },
  description:
    'Create courses, quizzes, flashcards, and study notes in minutes with AI. Fork, customize, and share with the community. Free and open source.',
  keywords: [
    'AI course generator',
    'open source LMS',
    'learning management system',
    'AI quiz generator',
    'AI flashcards',
    'study notes generator',
    'course creation platform',
    'educational technology',
    'edtech',
    'free LMS',
    'Next.js LMS',
    'Gemini AI courses',
    'online learning platform',
    'course marketplace',
    'open source education',
  ],
  authors: [{ name: 'Omkar', url: 'https://github.com/omkarspace' }],
  creator: 'Omkar',
  publisher: 'Coursei.ai',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://coursei.ai',
    siteName: 'Coursei.ai',
    title: 'Coursei.ai | AI-Powered Open-Source Learning Platform',
    description:
      'Create courses, quizzes, flashcards, and study notes in minutes with AI. Fork, customize, and share with the community.',
    images: [
      {
        url: '/og.svg',
        width: 1200,
        height: 630,
        alt: 'Coursei.ai - AI-Powered Learning Platform',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coursei.ai | AI-Powered Open-Source Learning Platform',
    description: 'Create courses, quizzes, flashcards, and study notes in minutes with AI.',
    images: ['/og.svg'],
    creator: '@omkareact',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://coursei.ai',
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://coursei.ai/#website',
      url: 'https://coursei.ai',
      name: 'Coursei.ai',
      description: 'AI-Powered Open-Source Learning Platform',
      publisher: { '@id': 'https://coursei.ai/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://coursei.ai/dashboard/explore?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://coursei.ai/#organization',
      name: 'Coursei.ai',
      url: 'https://coursei.ai',
      logo: {
        '@type': 'ImageObject',
        url: 'https://coursei.ai/logo.png',
        width: 512,
        height: 512,
      },
      sameAs: [
        'https://github.com/omkarspace/coursei.ai',
        'https://x.com/omkareact',
        'https://www.linkedin.com/in/omkarspace',
      ],
      founder: {
        '@type': 'Person',
        name: 'Omkar',
        url: 'https://github.com/omkarspace',
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Coursei.ai',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free and open source',
      },
      featureList: [
        'AI Course Generation',
        'AI Quiz Generator',
        'AI Flashcards',
        'AI Study Notes',
        'Course Forking',
        'Community Marketplace',
        'Dark Mode',
        'Export to PDF/Markdown',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Coursei.ai?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Coursei.ai is an AI-powered open-source learning platform that creates courses, quizzes, flashcards, and study notes in minutes. Fork it, customize it, and share with the community.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Coursei.ai free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! The open-source version is completely free and self-hosted. You get unlimited courses, AI generation, and full source code access.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the AI work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We use Google Gemini 2.0 Flash as our AI engine. It generates course structures, quizzes, flashcards, and study notes from your input.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I customize existing courses?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely! Coursei supports forking — like GitHub repos. Fork any public course, modify the content, add your own quizzes and flashcards, then publish your version.',
          },
        },
        {
          '@type': 'Question',
          name: 'What technologies does Coursei.ai use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Next.js 15, Tailwind CSS, Drizzle ORM, Neon PostgreSQL, Clerk authentication, Cloudinary storage, and Google Gemini AI. All modern, battle-tested technologies.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://coursei.ai',
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <TechnicalArchitecture />
      <Community />
      <Pricing />
      <FAQ />
      <Footer />
    </>
  );
}
