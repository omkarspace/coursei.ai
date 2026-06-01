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
