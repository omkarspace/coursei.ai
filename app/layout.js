import '@/lib/env'; // Validate env vars at startup - throws if required vars missing
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';

const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

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
  ],
  authors: [{ name: 'Omkar', url: 'https://github.com/omkarspace' }],
  creator: 'Omkar',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://coursei.ai',
    siteName: 'Coursei.ai',
    title: 'Coursei.ai | AI-Powered Open-Source Learning Platform',
    description: 'Create courses, quizzes, flashcards, and study notes in minutes with AI.',
    images: [
      {
        url: '/og.svg',
        width: 1200,
        height: 630,
        alt: 'Coursei.ai',
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="canonical" href="https://coursei.ai" />
        </head>
        <body className={`${poppins.className} ${inter.variable}`}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-primary"
          >
            Skip to main content
          </a>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
