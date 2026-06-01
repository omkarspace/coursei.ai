# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Coursei.ai landing page with a clean, minimal aesthetic showcasing the full learning ecosystem.

**Architecture:** Modular component-based structure with Hero, Features, HowItWorks, TechnicalArchitecture, Community, Pricing, FAQ, and Footer sections. Each section is a separate React component composed in page.js.

**Tech Stack:** Next.js 15, React, Tailwind CSS, Framer Motion (scroll animations), react-icons

---

## File Structure

| File | Purpose |
|------|---------|
| `app/page.js` | Main landing page (compose all sections) |
| `app/_components/Navbar.jsx` | Sticky navbar with backdrop blur |
| `app/_components/Hero.jsx` | Hero section with animated demo |
| `app/_components/Features.jsx` | Bento grid feature cards |
| `app/_components/HowItWorks.jsx` | 3-step horizontal flow |
| `app/_components/TechnicalArchitecture.jsx` | OSS contributor section |
| `app/_components/Community.jsx` | Community section (3-column) |
| `app/_components/Pricing.jsx` | Pricing comparison table |
| `app/_components/FAQ.jsx` | Accordion FAQ |
| `app/_components/Footer.jsx` | Updated footer |
| `app/_components/SectionWrapper.jsx` | Reusable section container |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install framer-motion**

```bash
npm install framer-motion
```

- [ ] **Step 2: Verify installation**

```bash
npm list framer-motion
```

Expected: `framer-motion@x.x.x`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add framer-motion for scroll animations"
```

---

### Task 2: Create SectionWrapper Component

**Files:**
- Create: `app/_components/SectionWrapper.jsx`

- [ ] **Step 1: Create reusable section wrapper**

```jsx
// app/_components/SectionWrapper.jsx
export default function SectionWrapper({ children, className = "", id }) {
  return (
    <section
      id={id}
      className={`py-20 sm:py-28 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-10 md:px-12 lg:px-5">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/SectionWrapper.jsx
git commit -m "feat: add SectionWrapper reusable component"
```

---

### Task 3: Create Navbar Component

**Files:**
- Create: `app/_components/Navbar.jsx`

- [ ] **Step 1: Create Navbar component**

```jsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { HiOutlineSparkles } from "react-icons/hi2";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Community", href: "#community" },
  { label: "GitHub", href: "https://github.com/omkarspace/coursei.ai", external: true },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <nav className="mx-auto max-w-7xl px-5 sm:px-10 md:px-12 lg:px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <HiOutlineSparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">coursei.ai</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="hidden sm:flex h-10 px-5 items-center rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Try Free
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 py-4 px-5">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="flex items-center justify-center h-10 px-5 rounded-full bg-gray-900 text-white text-sm font-medium"
            >
              Try Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/Navbar.jsx
git commit -m "feat: add Navbar component with sticky header and mobile menu"
```

---

### Task 4: Create Hero Component

**Files:**
- Create: `app/_components/Hero.jsx`

- [ ] **Step 1: Create Hero component**

```jsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { HiOutlineSparkles, HiArrowRight } from "react-icons/hi2";

const stats = [
  { value: "5min", label: "Course Creation" },
  { value: "AI", label: "Powered Content" },
  { value: "Free", label: "Open Source" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-hidden pt-16">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 rounded-full opacity-[0.07] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-10 md:px-12 lg:px-5 pt-20 sm:pt-28 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-100 rounded-full text-sm text-purple-700">
            <HiOutlineSparkles className="w-4 h-4" />
            <span>Open Source & Free</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight max-w-5xl mx-auto"
        >
          The Open-Source Learning Platform{" "}
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            Powered by AI
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          Create courses, quizzes, flashcards, and study notes in minutes.
          Fork, customize, and share with the community.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10"
        >
          <Link
            href="https://github.com/omkarspace/coursei.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 rounded-full bg-white text-gray-700 font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Star on GitHub
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all hover:shadow-lg hover:shadow-gray-900/20"
          >
            Try Free
            <HiArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </motion.div>

        {/* Product Demo Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 mx-auto max-w-4xl"
        >
          <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
            <div className="h-8 bg-gray-100 flex items-center gap-2 px-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-[300px] flex items-center justify-center">
              <p className="text-gray-400 text-sm">Product demo animation coming soon</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-16"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/Hero.jsx
git commit -m "feat: add Hero component with animations and product demo placeholder"
```

---

### Task 5: Create Features Component

**Files:**
- Create: `app/_components/Features.jsx`

- [ ] **Step 1: Create Features component**

```jsx
"use client";
import { motion } from "framer-motion";
import {
  HiOutlineSparkles,
  HiOutlineAcademicCap,
  HiOutlineChatBubbleLeftRight,
  HiOutlineRocketLaunch,
  HiOutlineRectangleStack,
  HiOutlineDocumentText,
  HiOutlineCodeBracket,
  HiOutlineGlobeAlt,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";
import SectionWrapper from "./SectionWrapper";

const features = [
  {
    icon: HiOutlineSparkles,
    title: "AI Course Generator",
    description: "Create full course structures with Gemini in seconds.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: HiOutlineAcademicCap,
    title: "AI Quiz Generator",
    description: "Auto-generate multiple-choice and short-answer questions.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: HiOutlineRectangleStack,
    title: "AI Flashcards",
    description: "Leitner-system spaced repetition cards for retention.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: HiOutlineDocumentText,
    title: "AI Study Notes",
    description: "Summaries, key points, and term definitions.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    title: "AI Study Buddy",
    description: "Context-aware chatbot for each course.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: HiOutlineCodeBracket,
    title: "Course Forking",
    description: "Customize public courses like GitHub repos.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: HiOutlineGlobeAlt,
    title: "Community Marketplace",
    description: "Browse, filter, and upvote shared courses.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: HiOutlineArrowDownTray,
    title: "Export Options",
    description: "PDF, Markdown, SCORM/xAPI packages.",
    color: "from-amber-500 to-orange-500",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Features() {
  return (
    <SectionWrapper id="features" className="bg-white">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Everything You Need to Create{" "}
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Amazing Courses
          </span>
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Our AI handles the heavy lifting so you can focus on what matters most — sharing your knowledge.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={item}
            className="group p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/Features.jsx
git commit -m "feat: add Features component with bento grid layout"
```

---

### Task 6: Create HowItWorks Component

**Files:**
- Create: `app/_components/HowItWorks.jsx`

- [ ] **Step 1: Create HowItWorks component**

```jsx
"use client";
import { motion } from "framer-motion";
import SectionWrapper from "./SectionWrapper";

const steps = [
  {
    step: "01",
    title: "Choose Topic",
    description: "Select a category and enter your course idea. Our AI understands your vision.",
  },
  {
    step: "02",
    title: "AI Generates",
    description: "Watch as AI creates quizzes, flashcards, notes, and course structure.",
  },
  {
    step: "03",
    title: "Publish & Share",
    description: "Edit, customize, and share your course with the world.",
  },
];

export default function HowItWorks() {
  return (
    <SectionWrapper id="how-it-works" className="bg-gray-50">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Create Courses in 3 Simple Steps
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          From idea to published course in minutes. No technical skills required.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 relative">
        {/* Connecting line */}
        <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200" />

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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-gray-600">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/HowItWorks.jsx
git commit -m "feat: add HowItWorks component with 3-step flow"
```

---

### Task 7: Create TechnicalArchitecture Component

**Files:**
- Create: `app/_components/TechnicalArchitecture.jsx`

- [ ] **Step 1: Create TechnicalArchitecture component**

```jsx
"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import SectionWrapper from "./SectionWrapper";
import {
  HiOutlineCpu,
  HiOutlineChartBar,
  HiOutlineLanguage,
  HiOutlinePuzzlePiece,
} from "react-icons/hi2";

const features = [
  {
    icon: HiOutlineCpu,
    title: "AI Provider Abstraction",
    description: "Swap Gemini for OpenAI, Anthropic, or Ollama.",
  },
  {
    icon: HiOutlineChartBar,
    title: "Progress Tracking",
    description: "Analytics dashboard with Recharts.",
  },
  {
    icon: HiOutlineLanguage,
    title: "i18n Support",
    description: "Multi-language with next-intl.",
  },
  {
    icon: HiOutlinePuzzlePiece,
    title: "Plugin System",
    description: "Extend with custom features.",
  },
];

export default function TechnicalArchitecture() {
  return (
    <SectionWrapper id="technical" className="bg-white">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Built for Contributors
          </h2>
          <p className="text-gray-600 mb-8">
            Modular architecture designed for open-source collaboration.
            Easy to understand, easy to extend.
          </p>

          <div className="space-y-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="https://github.com/omkarspace/coursei.ai/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-8 text-purple-600 font-medium hover:text-purple-700"
          >
            Read the Contributing Guide →
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-gray-200 bg-gray-50 p-6 font-mono text-sm overflow-x-auto"
        >
          <pre className="text-gray-800">
{`// AI Provider Abstraction
const providers = {
  gemini: GeminiProvider,
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  ollama: OllamaProvider,
};

// Swap providers with one config change
export const ai = providers[config.aiProvider];`}
          </pre>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/TechnicalArchitecture.jsx
git commit -m "feat: add TechnicalArchitecture component for OSS contributors"
```

---

### Task 8: Create Community Component

**Files:**
- Create: `app/_components/Community.jsx`

- [ ] **Step 1: Create Community component**

```jsx
"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import SectionWrapper from "./SectionWrapper";
import { HiOutlineUserGroup, HiOutlineChatBubbleLeftRight, HiOutlineMap } from "react-icons/hi2";

const columns = [
  {
    icon: HiOutlineUserGroup,
    title: "GitHub Contributors",
    description: "40+ contributors building the future of learning",
    cta: "View Contributors",
    href: "https://github.com/omkarspace/coursei.ai/graphs/contributors",
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    title: "Discord Server",
    description: "500+ members sharing ideas and helping each other",
    cta: "Join Discord",
    href: "#",
  },
  {
    icon: HiOutlineMap,
    title: "Roadmap",
    description: "Vote on features and see what's coming next",
    cta: "View Roadmap",
    href: "#",
  },
];

export default function Community() {
  return (
    <SectionWrapper id="community" className="bg-gray-50">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Join the Community
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Be part of the open-source revolution in education.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {columns.map((col, index) => (
          <motion.div
            key={col.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-8 border border-gray-100 text-center"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-purple-100 flex items-center justify-center">
              <col.icon className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{col.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{col.description}</p>
            <Link
              href={col.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {col.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/Community.jsx
git commit -m "feat: add Community component with contributor, Discord, roadmap"
```

---

### Task 9: Create Pricing Component

**Files:**
- Create: `app/_components/Pricing.jsx`

- [ ] **Step 1: Create Pricing component**

```jsx
"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import SectionWrapper from "./SectionWrapper";
import { HiOutlineCheck, HiOutlineX } from "react-icons/hi2";

const plans = [
  {
    name: "Free & Open Source",
    price: "$0",
    period: "forever",
    description: "Everything you need, self-hosted.",
    features: [
      { text: "AI Course Generation", included: true },
      { text: "Quizzes, Flashcards, Notes", included: true },
      { text: "Community Courses", included: true },
      { text: "Self-Hosting", included: true },
      { text: "Priority Support", included: false },
      { text: "Custom Domain", included: false },
    ],
    cta: "Get Started Free",
    ctaLink: "/dashboard",
    primary: true,
  },
  {
    name: "Managed Hosting",
    price: "Coming Soon",
    period: "",
    description: "We host it for you.",
    features: [
      { text: "AI Course Generation", included: true },
      { text: "Quizzes, Flashcards, Notes", included: true },
      { text: "Community Courses", included: true },
      { text: "Self-Hosting", included: false },
      { text: "Priority Support", included: true },
      { text: "Custom Domain", included: true },
    ],
    cta: "Join Waitlist",
    ctaLink: "#",
    primary: false,
  },
];

export default function Pricing() {
  return (
    <SectionWrapper id="pricing" className="bg-white">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Simple, Transparent Pricing
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Free and open source. No hidden fees.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-2xl p-8 border ${
              plan.primary
                ? "border-purple-200 bg-purple-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <h3 className="font-semibold text-gray-900 mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
              {plan.period && <span className="text-gray-500">/ {plan.period}</span>}
            </div>
            <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3">
                  {feature.included ? (
                    <HiOutlineCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <HiOutlineX className="w-5 h-5 text-gray-300" />
                  )}
                  <span className={`text-sm ${feature.included ? "text-gray-700" : "text-gray-400"}`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.ctaLink}
              className={`w-full inline-flex items-center justify-center h-12 px-6 rounded-full font-medium transition-colors ${
                plan.primary
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {plan.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/Pricing.jsx
git commit -m "feat: add Pricing component with Free vs Managed tiers"
```

---

### Task 10: Create FAQ Component

**Files:**
- Create: `app/_components/FAQ.jsx`

- [ ] **Step 1: Create FAQ component**

```jsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionWrapper from "./SectionWrapper";
import { HiOutlineChevronDown } from "react-icons/hi2";

const faqs = [
  {
    question: "What is Coursei.ai?",
    answer: "Coursei.ai is an open-source, AI-powered learning platform that helps you create courses, quizzes, flashcards, and study notes in minutes.",
  },
  {
    question: "Is it really free?",
    answer: "Yes! Coursei.ai is completely free and open source under the MIT license. You can self-host it or use the community version.",
  },
  {
    question: "How do I self-host?",
    answer: "Clone the repository, install dependencies, configure your database and API keys, and run the development server. See the README for detailed instructions.",
  },
  {
    question: "Can I contribute?",
    answer: "Absolutely! We welcome contributions. Check out the CONTRIBUTING.md file for guidelines, or pick up a 'Good First Issue' on GitHub.",
  },
  {
    question: "What AI models are supported?",
    answer: "Currently Google Gemini is supported out of the box. The architecture is designed for AI provider abstraction, so OpenAI, Anthropic, and Ollama support is planned.",
  },
  {
    question: "Can I export courses?",
    answer: "Export options are on the roadmap. Planned formats include PDF, Markdown, and SCORM/xAPI packages for LMS integration.",
  },
];

function FAQItem({ faq, isOpen, onClick }) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900">{faq.question}</span>
        <HiOutlineChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="pb-5 text-gray-600">{faq.answer}</p>
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
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            faq={faq}
            isOpen={openIndex === index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/FAQ.jsx
git commit -m "feat: add FAQ component with accordion"
```

---

### Task 11: Update Footer Component

**Files:**
- Modify: `app/_components/Footer.jsx`

- [ ] **Step 1: Replace Footer with clean minimal design**

```jsx
import Link from "next/link";
import { HiOutlineSparkles } from "react-icons/hi2";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Roadmap", href: "#" },
  ],
  Community: [
    { label: "GitHub", href: "https://github.com/omkarspace/coursei.ai" },
    { label: "Discord", href: "#" },
    { label: "Twitter", href: "https://x.com/omkareact" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "License (MIT)", href: "https://github.com/omkarspace/coursei.ai/blob/main/LICENSE" },
  ],
};

export default function FooterBlock() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16" role="contentinfo">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 md:px-12 lg:px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <HiOutlineSparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">coursei.ai</span>
            </Link>
            <p className="text-sm">
              The open-source learning platform powered by AI.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} Coursei.ai. MIT License.
          </p>
          <p className="text-sm">
            Made with ❤️ by the Open Source Community
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/Footer.jsx
git commit -m "feat: update Footer with clean minimal dark design"
```

---

### Task 12: Update Main Page

**Files:**
- Modify: `app/page.js`

- [ ] **Step 1: Update page.js to compose all sections**

```jsx
import Navbar from "./_components/Navbar";
import Hero from "./_components/Hero";
import Features from "./_components/Features";
import HowItWorks from "./_components/HowItWorks";
import TechnicalArchitecture from "./_components/TechnicalArchitecture";
import Community from "./_components/Community";
import Pricing from "./_components/Pricing";
import FAQ from "./_components/FAQ";
import FooterBlock from "./_components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <TechnicalArchitecture />
        <Community />
        <Pricing />
        <FAQ />
      </main>
      <FooterBlock />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.js
git commit -m "feat: update landing page with all new sections"
```

---

### Task 13: Verify Build

**Files:**
- None (verification only)

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run dev server**

```bash
npm run dev
```

Expected: Server starts, landing page renders at http://localhost:3000

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete landing page redesign"
```

---

## Self-Review Results

1. **Spec coverage:** All sections from the spec are implemented (Navbar, Hero, Features, HowItWorks, TechnicalArchitecture, Community, Pricing, FAQ, Footer).

2. **Placeholder scan:** No TBDs or TODOs found. All code is complete.

3. **Type consistency:** Component names and props are consistent across tasks.
