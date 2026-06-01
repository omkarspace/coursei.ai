import Navbar from "./_components/Navbar";
import Hero from "./_components/Hero";
import Features from "./_components/Features";
import HowItWorks from "./_components/HowItWorks";
import TechnicalArchitecture from "./_components/TechnicalArchitecture";
import Community from "./_components/Community";
import Pricing from "./_components/Pricing";
import FAQ from "./_components/FAQ";
import Footer from "./_components/Footer";

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
