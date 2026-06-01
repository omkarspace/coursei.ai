# Contributing to Coursei.ai

Thank you for your interest in contributing to Coursei.ai! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Community](#community)

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm, yarn, or pnpm
- Git

### Accounts Needed

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Clerk](https://clerk.com) | Authentication | 10,000 MAUs |
| [Google AI Studio](https://aistudio.google.com) | Gemini AI | Generous free tier |
| [Neon](https://neon.tech) | PostgreSQL database | 0.5 GB storage |
| [Cloudinary](https://cloudinary.com) | Image uploads | 25 GB storage |

### Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/coursei.ai.git
cd coursei.ai

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 5. Push database schema
npm run db:push

# 6. Start development server
npm run dev
```

### Getting API Keys

1. **Clerk**: Sign up → Create application → Copy keys from Dashboard
2. **Google AI Studio**: Sign up → Get API key → Enable Gemini API
3. **Neon**: Create project → Copy connection string
4. **Cloudinary**: Sign up → Settings → API Keys → Create unsigned upload preset

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feature/` | New features | `feature/quiz-export` |
| `fix/` | Bug fixes | `fix/flashcard-flip-animation` |
| `docs/` | Documentation | `docs/update-readme` |
| `refactor/` | Code refactoring | `refactor/server-actions` |
| `test/` | Adding tests | `test/quiz-generator` |
| `chore/` | Maintenance | `chore/upgrade-dependencies` |

### Development Process

1. **Create a branch** from `main`
2. **Make your changes** in small, focused commits
3. **Test locally** with `npm run dev`
4. **Build** with `npm run build` to catch errors
5. **Submit a pull request**

### Hot to Run

```bash
# Development
npm run dev          # Start dev server at localhost:3000

# Database
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio GUI

# Production
npm run build        # Build for production
npm run start        # Start production server
```

## Code Style

### General Rules

- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Use **semicolons** at end of statements
- Use **TypeScript/JSX** for components
- Follow existing code patterns

### React Components

```jsx
// Use functional components with hooks
"use client";

import { useState } from "react";

export default function MyComponent({ title }) {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4">
      <h1>{title}</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
```

### Server Actions

```javascript
// Use server actions for database mutations
"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function myAction(formData) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  // Perform database operation
  const result = await db.insert(...).returning();
  return result;
}
```

### Styling

- Use **Tailwind CSS** utility classes
- Use **shadcn/ui** components when available
- Follow the existing color scheme
- Use **dark mode** classes: `dark:` prefix

## Commit Guidelines

### Commit Message Format

```
<type>: <description>

[optional body]

[optional footer]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add quiz export to PDF` |
| `fix` | Bug fix | `fix: resolve flashcard flip animation` |
| `docs` | Documentation | `docs: update API reference` |
| `style` | Code style | `style: fix indentation in Hero` |
| `refactor` | Refactoring | `refactor: extract server actions` |
| `test` | Tests | `test: add quiz generator tests` |
| `chore` | Maintenance | `chore: upgrade Next.js to 15.5` |

### Examples

```bash
# Good commit messages
git commit -m "feat: add AI flashcard generation"
git commit -m "fix: resolve dark mode toggle not persisting"
git commit -m "docs: add Cloudinary setup instructions"

# Bad commit messages
git commit -m "update"
git commit -m "fix stuff"
git commit -m "WIP"
```

## Pull Request Process

### Before Submitting

1. **Test your changes** thoroughly
2. **Build** the project: `npm run build`
3. **Update documentation** if needed
4. **Keep PRs focused** — one feature/fix per PR

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Build passes
- [ ] No console errors

## Screenshots (if applicable)
Add screenshots of UI changes

## Related Issues
Closes #123
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged

## Reporting Issues

### Bug Reports

Include:
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Browser/OS information**
- **Screenshots** (if applicable)

### Feature Requests

Include:
- **Use case** — Why is this needed?
- **Proposed solution** — How should it work?
- **Alternatives considered** — Any other approaches?

## Community

- **GitHub Issues**: [Report bugs or request features](https://github.com/omkarspace/coursei.ai/issues)
- **Discussions**: [Ask questions](https://github.com/omkarspace/coursei.ai/discussions)
- **Twitter**: [@omkareact](https://x.com/omkareact)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Coursei.ai! 🎓
