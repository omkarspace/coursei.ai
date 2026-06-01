<p align="center">
  <img src="public/logo.png" alt="Coursei.ai Logo" width="100" />
</p>

<h1 align="center">Coursei.ai</h1>

<p align="center">
  The open-source learning platform powered by AI.<br/>
  Create courses, quizzes, flashcards, and study notes in minutes.
</p>

<p align="center">
  <a href="https://coursei.ai">Live Demo</a> ·
  <a href="https://github.com/omkarspace/coursei.ai/issues">Report Bug</a> ·
  <a href="https://github.com/omkarspace/coursei.ai/blob/main/CONTRIBUTING.md">Contribute</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/next.js-15.5-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/react-18-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/tailwind-3.4-blue?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/prs-welcome-orange" alt="PRs Welcome" />
</p>

---

## Features

### AI-Powered Tools
- **AI Course Generator** — Generate full course structures with Gemini in seconds
- **AI Quiz Generator** — Auto-generate multiple-choice and short-answer questions
- **AI Flashcards** — Leitner-system spaced repetition cards for retention
- **AI Study Notes** — Summaries, key points, and term definitions
- **AI Study Buddy** — Context-aware chatbot for each course

### Platform
- **Course Forking** — Customize public courses like GitHub repos
- **Community Marketplace** — Browse, filter, and upvote shared courses
- **Export Options** — PDF, Markdown, SCORM/xAPI packages
- **Dark Mode** — Full dark mode with system preference detection
- **Mobile First** — Responsive design across all devices

### Technical
- **Server Actions** — Secure, authenticated database mutations
- **Image Uploads** — Cloudinary-powered course banner uploads
- **Real-time Updates** — Instant UI updates after mutations
- **Type Safety** — ESLint + Next.js type checking

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 18, Tailwind CSS, shadcn/ui |
| Auth | Clerk |
| AI | Google Gemini 2.0 Flash |
| Database | Neon PostgreSQL + Drizzle ORM |
| Storage | Cloudinary (unsigned uploads) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm, yarn, or pnpm
- Accounts for: [Clerk](https://clerk.com), [Google AI Studio](https://aistudio.google.com), [Neon](https://neon.tech), [Cloudinary](https://cloudinary.com)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/omkarspace/coursei.ai.git
cd coursei.ai

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your API keys (see Environment Variables below)

# 4. Push database schema
npm run db:push

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Yes | Google Gemini API key |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_HOST_NAME` | Yes | App URL (e.g., `http://localhost:3000`) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Yes | Cloudinary unsigned upload preset |
| `NEXT_PUBLIC_YOUTUBE_API_KEY` | No | YouTube API key (for video search) |

## Project Structure

```
coursei.ai/
├── app/
│   ├── _components/          # Shared UI components
│   │   ├── Navbar.jsx        # Sticky navigation
│   │   ├── Hero.jsx          # Landing page hero
│   │   ├── Features.jsx      # Feature cards
│   │   ├── Pricing.jsx       # Pricing plans
│   │   ├── FAQ.jsx           # Accordion FAQ
│   │   ├── QuizGenerator.jsx # AI quiz UI
│   │   ├── Flashcards.jsx    # 3D flip flashcards
│   │   ├── StudyNotes.jsx    # AI study notes
│   │   └── ThemeToggle.jsx   # Dark mode toggle
│   ├── actions/              # Server Actions (DB mutations)
│   ├── create-course/        # Course creation wizard
│   ├── course/               # Public course viewing
│   ├── dashboard/            # User dashboard
│   └── sign-in/              # Auth pages
├── configs/
│   ├── schema.jsx            # Drizzle DB schema (5 tables)
│   ├── AiModel.jsx           # Gemini AI chat sessions
│   └── cloudinary.js         # Cloudinary config
├── lib/                      # Utility functions
├── components/ui/            # shadcn/ui components
└── public/                   # Static assets
```

## Database Schema

| Table | Description |
|-------|-------------|
| `CourseList` | Course metadata, banners, ownership |
| `Chapters` | Chapter content per course |
| `Quizzes` | Generated quiz questions |
| `Flashcards` | Generated flashcard decks |
| `StudyNotes` | Generated study notes |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push database schema |
| `npm run db:studio` | Open Drizzle Studio |

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Setting up the development environment
- Branch naming conventions
- Pull request process
- Code style guidelines

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/omkarspace">Omkar</a>
</p>
