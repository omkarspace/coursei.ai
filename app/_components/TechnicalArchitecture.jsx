"use client";
import { motion } from "framer-motion";
import SectionWrapper from "./SectionWrapper";

const techStack = [
  { name: "Next.js 15", role: "Framework", color: "bg-gray-900 text-white" },
  { name: "Tailwind CSS", role: "Styling", color: "bg-cyan-500 text-white" },
  { name: "Drizzle ORM", role: "Database", color: "bg-emerald-500 text-white" },
  { name: "Neon PostgreSQL", role: "Database Host", color: "bg-indigo-500 text-white" },
  { name: "Clerk", role: "Authentication", color: "bg-violet-500 text-white" },
  { name: "Gemini AI", role: "AI Engine", color: "bg-blue-500 text-white" },
  { name: "Firebase Storage", role: "File Storage", color: "bg-amber-500 text-white" },
  { name: "Vercel", role: "Deployment", color: "bg-black text-white" },
];

const archStats = [
  { value: "99.9%", label: "Uptime" },
  { value: "<100ms", label: "Response Time" },
  { value: "SOC2", label: "Compliant" },
  { value: "100%", label: "Open Source" },
];

export default function TechnicalArchitecture() {
  return (
    <SectionWrapper id="architecture" className="bg-white">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Built with{" "}
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Modern Tech
          </span>
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Enterprise-grade architecture, open-source transparency.
        </p>
      </div>

      {/* Architecture Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
      >
        {archStats.map((stat) => (
          <div key={stat.label} className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Tech Stack Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {techStack.map((tech, index) => (
          <motion.div
            key={tech.name}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg ${tech.color} flex items-center justify-center text-sm font-bold mb-3 group-hover:scale-110 transition-transform`}>
              {tech.name.charAt(0)}
            </div>
            <div className="font-medium text-gray-900 text-sm">{tech.name}</div>
            <div className="text-xs text-gray-500">{tech.role}</div>
          </motion.div>
        ))}
      </div>

      {/* OSS CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 text-center"
      >
        <a
          href="https://github.com/omkarspace/coursei.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          View Architecture on GitHub
        </a>
      </motion.div>
    </SectionWrapper>
  );
}
