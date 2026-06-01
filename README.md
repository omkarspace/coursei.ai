# Coursei.ai

AI-powered course generation platform. Create, customize, and share educational courses using artificial intelligence.

## Features

- **AI Course Generation**: Generate course outlines and chapter content using Google Gemini AI
- **Customizable Modules**: Adjust course categories, topics, difficulty levels, and chapter count
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **User Authentication**: Secure sign-in/sign-up with Clerk
- **Course Management**: Create, edit, delete, and publish courses
- **Public Course Viewing**: Share courses via unique URLs
- **Image Uploads**: Custom course banners via Firebase Storage

## Tech Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Authentication**: Clerk
- **AI**: Google Gemini API
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Storage**: Firebase Storage
- **UI Components**: shadcn/ui, Radix UI

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- Accounts for: Clerk, Google AI Studio, Neon, Firebase (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/omkarspace/coursei.ai.git
   cd coursei.ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Fill in your API keys in `.env` (see [Environment Variables](#environment-variables))

5. Push database schema:
   ```bash
   npm run db:push
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Yes | Google Gemini API key |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_HOST_NAME` | Yes | App URL (e.g., `http://localhost:3000`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | No | Firebase API key (for image uploads) |
| `NEXT_PUBLIC_YOUTUBE_API_KEY` | No | YouTube API key (for video search) |

## Project Structure

```
coursei.ai/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── actions/             # Server Actions (database mutations)
│   ├── create-course/       # Course creation wizard
│   ├── course/              # Public course viewing
│   ├── dashboard/           # User dashboard
│   ├── _components/         # Shared components
│   ├── _context/            # React contexts
│   └── _shared/             # Shared utilities
├── components/ui/           # shadcn/ui components
├── configs/                 # Configuration files
│   ├── schema.jsx           # Database schema
│   ├── AiModel.jsx          # Gemini AI setup
│   └── firebaseConfig.jsx   # Firebase config
├── lib/                     # Utility functions
└── public/                  # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema
- `npm run db:studio` - Open Drizzle Studio

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
