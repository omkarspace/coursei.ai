import Navbar from "./_components/Navbar";
import Hero from "./_components/Hero";
import Features from "./_components/Features";
import HowItWorks from "./_components/HowItWorks";
import TechnicalArchitecture from "./_components/TechnicalArchitecture";
import Community from "./_components/Community";
import Pricing from "./_components/Pricing";
import FAQ from "./_components/FAQ";
import Footer from "./_components/Footer";

export const metadata = {
  title: "Coursei.ai | AI-Powered Open-Source Learning Platform",
  description:
    "Create courses, quizzes, flashcards, and study notes in minutes with AI. Fork, customize, and share with the community. Free and open source.",
  openGraph: {
    title: "Coursei.ai | AI-Powered Open-Source Learning Platform",
    description:
      "Create courses, quizzes, flashcards, and study notes in minutes with AI. Fork, customize, and share with the community.",
    url: "https://coursei.ai",
    siteName: "Coursei.ai",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Coursei.ai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coursei.ai | AI-Powered Open-Source Learning Platform",
    description:
      "Create courses, quizzes, flashcards, and study notes in minutes with AI.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return (
    <>
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
