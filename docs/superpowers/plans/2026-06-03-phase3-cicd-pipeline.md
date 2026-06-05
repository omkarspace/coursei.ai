# Phase 3: CI/CD Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GitHub Actions CI workflow that runs lint, typecheck, tests, and build on every push and PR.

**Architecture:** Single GitHub Actions workflow with 4 parallel jobs covering all quality gates.

**Tech Stack:** GitHub Actions, Node.js 20.x

---

## File Structure

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI workflow definition |

---

### Task 1: Create GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create .github/workflows directory**

Run: `mkdir -p .github/workflows`

- [ ] **Step 2: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript check
        run: npx tsc --noEmit

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run build
        run: npm run build
        env:
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_placeholder
          CLERK_SECRET_KEY: sk_test_placeholder
          NEXT_PUBLIC_GEMINI_API_KEY: placeholder
          DATABASE_URL: postgresql://placeholder
          NEXT_PUBLIC_HOST_NAME: http://localhost:3000
```

- [ ] **Step 3: Verify workflow syntax**

Run: `cat .github/workflows/ci.yml`
Expected: Valid YAML with 4 jobs

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI workflow"
```

---

### Task 2: Verify CI Workflow Locally

**Files:** None (verification only)

- [ ] **Step 1: Run all quality gates locally**

Run each command and verify they pass:
```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

- [ ] **Step 2: Document any issues**

If any check fails, fix it before committing.

- [ ] **Step 3: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix: resolve CI issues"
```

---

## Summary

| Task | Description | Changes |
|------|-------------|---------|
| 1 | Create CI workflow | 1 new file |
| 2 | Verify locally | All checks pass |
