# Contributing to Coursei.ai

Thank you for your interest in contributing to Coursei.ai! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- A Clerk account (for authentication)
- A Google AI Studio account (for Gemini API)
- A Neon account (for PostgreSQL database)

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/coursei.ai.git
   cd coursei.ai
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
5. Fill in your environment variables in `.env`
6. Push the database schema:
   ```bash
   npm run db:push
   ```
7. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring

### Code Style

- Use consistent indentation (2 spaces)
- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic

### Commit Messages

Use clear, descriptive commit messages:
- `feat: add course search functionality`
- `fix: resolve image upload issue`
- `docs: update README with setup instructions`
- `refactor: improve error handling`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit a pull request with:
   - Clear description of changes
   - Screenshots (if UI changes)
   - Related issue numbers

## Reporting Issues

When reporting issues, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/OS information
- Screenshots (if applicable)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a welcoming environment

## Questions?

Feel free to open an issue for any questions about contributing!
