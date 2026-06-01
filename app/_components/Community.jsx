"use client";
import { motion } from "framer-motion";
import {
  HiOutlineCodeBracket,
  HiOutlineChatBubbleLeftRight,
  HiOutlineHeart,
} from "react-icons/hi2";
import SectionWrapper from "./SectionWrapper";

const communityItems = [
  {
    icon: HiOutlineCodeBracket,
    title: "Contribute Code",
    description: "Submit PRs, fix bugs, and build new features for the platform.",
    link: "https://github.com/omkarspace/coursei.ai",
    linkText: "View on GitHub",
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    title: "Share Feedback",
    description: "Report bugs, suggest features, and help us improve the product.",
    link: "https://github.com/omkarspace/coursei.ai/issues",
    linkText: "Open Issue",
  },
  {
    icon: HiOutlineHeart,
    title: "Join Community",
    description: "Connect with educators, developers, and learners worldwide.",
    link: "https://github.com/omkarspace/coursei.ai/discussions",
    linkText: "Start Discussion",
  },
];

export default function Community() {
  return (
    <SectionWrapper id="community" className="bg-gray-50">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Join the{" "}
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Open Source Community
          </span>
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Help us build the future of open-source education. Every contribution matters.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {communityItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 }}
            className="p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all text-center group"
          >
            <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <item.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">{item.description}</p>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700 transition-colors"
            >
              {item.linkText}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
