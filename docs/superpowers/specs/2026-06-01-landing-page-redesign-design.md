# Landing Page Redesign Design Spec

**Date:** 2026-06-01
**Status:** Approved
**Approach:** Product-Led Minimal (Clean & Minimal aesthetic)

---

## Goals

1. **Conversions** — Maximize signups and GitHub stars
2. **Education** — Clearly explain what Coursei.ai does and its full feature set
3. **Community** — Attract open-source contributors

---

## Design Principles

- **Clean & Minimal** — Apple/Vercel aesthetic with lots of whitespace
- **Product-Led** — Show actual UI, not illustrations
- **Single CTA Focus** — One primary action per section
- **Social Proof Above Fold** — Metrics and trust signals early

---

## Page Structure

### 1. Navbar (Sticky)

```
Logo | Features | How It Works | Community | GitHub | [Try Free]
```

- Fixed position with backdrop blur
- Logo (sparkle icon + "coursei.ai")
- Links: Features, How It Works, Community, GitHub
- CTA button: "Try Free" (primary style)
- Mobile: Hamburger menu with same links

### 2. Hero Section

**Layout:**

```
[Badge: "Open Source & Free"]

[Headline: "The Open-Source Learning Platform Powered by AI"]

[Subheadline: "Create courses, quizzes, flashcards, and study notes in minutes.
Fork, customize, and share with the community."]

[CTA: "Star on GitHub" (secondary) | "Try Free" (primary)]

[Animated Product Demo: Course creation → Quiz generation → Flashcard flip]
```

**Visual:**

- Animated gradient background (subtle, not distracting)
- Product demo: CSS animation showing course creation flow (static screenshots with transitions)
- Stats below: Dynamic counters or placeholder text (update when real data available)

### 3. Social Proof Bar

```
[Logo cloud or contributor avatars]

"Trusted by educators and developers worldwide"
```

- Scrolling or static row of contributor avatars (from GitHub)
- Or: GitHub stars badge + "Open Source" badge

### 4. Features Grid (Bento Layout)

**Section Headline:** "Everything You Need to Create Amazing Courses"

**Layout:** 2x4 bento grid (responsive)

| Feature               | Icon                | Description                                              |
| --------------------- | ------------------- | -------------------------------------------------------- |
| AI Course Generator   | Sparkles            | Create full course structures with Gemini in seconds     |
| AI Quiz Generator     | AcademicCap         | Auto-generate multiple-choice and short-answer questions |
| AI Flashcards         | RectangleStack      | Leitner-system spaced repetition cards for retention     |
| AI Study Notes        | DocumentText        | Summaries, key points, and term definitions              |
| AI Study Buddy        | ChatBubbleLeftRight | Context-aware chatbot for each course                    |
| Course Forking        | CodeBracket         | Customize public courses like GitHub repos               |
| Community Marketplace | Globe               | Browse, filter, and upvote shared courses                |
| Export Options        | ArrowDownTray       | PDF, Markdown, SCORM/xAPI packages                       |

**Style:**

- Each card has gradient icon (matching current color scheme)
- Hover effect: subtle scale + shadow
- Cards have consistent padding and border radius

### 5. How It Works (3 Steps)

**Section Headline:** "Create Courses in 3 Simple Steps"

**Layout:** Horizontal 3-step flow with connecting lines

```
[Step 01] ─────────── [Step 02] ─────────── [Step 03]
Choose Topic          AI Generates          Publish & Share
```

**Step 1: Choose Topic**

- Select a category (Programming, Business, Design, etc.)
- Enter your course idea
- Set duration and difficulty

**Step 2: AI Generates**

- Course structure with chapters
- Quizzes and assessments
- Flashcards and study notes

**Step 3: Publish & Share**

- Edit and customize
- Fork from community courses
- Export to PDF, Markdown, or LMS

**Visual:**

- Each step has a mock UI screenshot
- Steps connected by dotted lines
- Numbered circles (01, 02, 03) in gradient

### 6. Technical Architecture (For OSS Contributors)

**Section Headline:** "Built for Contributors"

**Layout:** 2-column (text left, code/visual right)

**Left column (text):**

- AI Provider Abstraction — Swap Gemini for OpenAI, Anthropic, or Ollama
- Progress Tracking — Analytics dashboard with Recharts
- i18n Support — Multi-language with next-intl
- Plugin System — Extend with custom features

**Right column (visual):**

- Code snippet showing AI provider abstraction
- Or: Architecture diagram

**CTA:** "Read the Contributing Guide"

### 7. Community Section

**Section Headline:** "Join the Community"

**Layout:** 3-column grid

| Column 1                   | Column 2       | Column 3           |
| -------------------------- | -------------- | ------------------ |
| GitHub Contributors        | Discord Server | Roadmap            |
| [Contributor avatars grid] | [Join Discord] | [View Roadmap]     |
| "40+ contributors"         | "500+ members" | "Vote on features" |

**Style:**

- Each column is a card
- Contributors: GitHub avatar grid (top 12)
- Discord: Button with Discord icon
- Roadmap: Link to GitHub Projects or Linear

### 8. Pricing

**Section Headline:** "Simple, Transparent Pricing"

**Layout:** 2-column (Free vs Pro)

| Feature                    | Free & Open Source | Managed Hosting (Future) |
| -------------------------- | ------------------ | ------------------------ |
| Price                      | $0 forever         | $X/month                 |
| AI Course Generation       | ✓                  | ✓                        |
| Quizzes, Flashcards, Notes | ✓                  | ✓                        |
| Community Courses          | ✓                  | ✓                        |
| Self-Hosting               | ✓                  | —                        |
| Priority Support           | —                  | ✓                        |
| Custom Domain              | —                  | ✓                        |

**Note:** For now, emphasize "Free & Open Source" with self-hosting option. Managed hosting is a future tier.

**CTA:** "Get Started Free" | "Star on GitHub"

### 9. FAQ

**Section Headline:** "Frequently Asked Questions"

**Layout:** Accordion style

**Questions:**

1. What is Coursei.ai?
2. Is it really free?
3. How do I self-host?
4. Can I contribute?
5. What AI models are supported?
6. Can I export courses?

### 10. Final CTA

**Layout:** Full-width gradient background

```
[Headline: "Ready to Transform Your Learning?"]

[CTA: "Start Building" (primary) | "Join Discord" (secondary)]
```

### 11. Footer

**Layout:** 4-column grid

```
Column 1: Logo + tagline
Column 2: Product (Features, Pricing, Roadmap)
Column 3: Community (GitHub, Discord, Twitter)
Column 4: Legal (Privacy, Terms, License)
```

**Bottom:** Copyright + "Made with ❤️ by Open Source Community"

---

## Visual Style

### Colors

- Primary: Purple gradient (#7C3AED → #6366F1)
- Background: White (#FFFFFF) / Light gray (#F9FAFB)
- Text: Gray-900 (#111827) for headings, Gray-600 (#4B5563) for body
- Accents: Gradient from purple to indigo

### Typography

- Headings: Inter or Geist (bold, tight tracking)
- Body: Inter (regular, relaxed line-height)
- Code: Geist Mono or JetBrains Mono

### Spacing

- Section padding: 80px-120px vertical
- Max width: 1200px centered
- Card padding: 24px-32px

### Animations (Framer Motion)

- Hero text fade-in on load
- Feature cards stagger animation on scroll
- Steps slide in from left/right
- Stats count-up animation

---

## Responsive Breakpoints

- Mobile: < 640px (single column, stacked)
- Tablet: 640px-1024px (2-column grid)
- Desktop: > 1024px (full layout)

---

## Files to Modify

1. `app/page.js` — Main landing page
2. `app/_components/Hero.jsx` — Hero section (complete rewrite)
3. `app/_components/Footer.jsx` — Footer update
4. `app/globals.css` — Add animation utilities

**New Files:** 5. `app/_components/Features.jsx` — Bento feature grid 6. `app/_components/HowItWorks.jsx` — 3-step flow 7. `app/_components/TechnicalArchitecture.jsx` — OSS contributor section 8. `app/_components/Community.jsx` — Community section 9. `app/_components/Pricing.jsx` — Pricing section 10. `app/_components/FAQ.jsx` — Accordion FAQ

---

## Dependencies

- `framer-motion` — For scroll animations
- `react-icons` — For icons (already installed)

---

## Success Metrics

- GitHub stars increase by 50% within 1 month
- Landing page conversion rate > 5% (signup/star)
- Time on page > 2 minutes
- Bounce rate < 40%

---

## Open Questions

None — design approved by user.
