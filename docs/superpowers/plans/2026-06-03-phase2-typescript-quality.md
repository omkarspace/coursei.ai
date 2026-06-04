# Phase 2: TypeScript & Code Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix TypeScript gaps, remove legacy code, add Prettier formatting, and establish quality gates.

**Architecture:** Update tsconfig for stricter checks, clean up legacy AI model imports, add Prettier for consistent formatting.

**Tech Stack:** TypeScript, Prettier, ESLint (existing)

---

## File Structure

| File                  | Purpose                   |
| --------------------- | ------------------------- |
| `tsconfig.json`       | TypeScript config updates |
| `prettier.config.js`  | Prettier configuration    |
| `.prettierignore`     | Files to skip formatting  |
| `package.json`        | Add format scripts        |
| `configs/AiModel.jsx` | Remove (legacy)           |

---

### Task 1: Update TypeScript Configuration

**Files:**

- Modify: `tsconfig.json`

- [ ] **Step 1: Read current tsconfig**

Run: `cat tsconfig.json`
Expected: Current config with `strict: true`, includes `.ts` and `.tsx` only

- [ ] **Step 2: Update tsconfig.json**

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "**/*.jsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Changes:

- Added `"noUncheckedIndexedAccess": true` for safer array/object access
- Added `"**/*.jsx"` to `include` to cover JSX files

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: May show new errors from `noUncheckedIndexedAccess` — document them

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json
git commit -m "chore: update TypeScript config with stricter checks"
```

---

### Task 2: Fix TypeScript Errors from noUncheckedIndexedAccess

**Files:**

- Modify: files with type errors (identified in Task 1)

- [ ] **Step 1: Identify all TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -50`
Expected: List of errors related to undefined index access

- [ ] **Step 2: Fix errors in server/db/schema.ts**

Common pattern: `array[index]` may be undefined. Fix by adding null checks or using `.at()`.

Example fix:

```typescript
// Before
const item = array[0];

// After
const item = array[0];
if (!item) throw new Error('Not found');
```

- [ ] **Step 3: Fix errors in other files**

Apply same pattern to all identified errors.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors from stricter index checks"
```

---

### Task 3: Add Prettier Configuration

**Files:**

- Create: `prettier.config.js`
- Create: `.prettierignore`
- Modify: `package.json`

- [ ] **Step 1: Install Prettier**

Run: `npm install -D prettier`
Expected: Prettier installed

- [ ] **Step 2: Create prettier.config.js**

Create `prettier.config.js`:

```javascript
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
};
```

- [ ] **Step 3: Create .prettierignore**

Create `.prettierignore`:

```
node_modules
.next
dist
build
coverage
package-lock.json
```

- [ ] **Step 4: Add format scripts to package.json**

Add to `scripts` in `package.json`:

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

- [ ] **Step 5: Verify Prettier works**

Run: `npm run format:check`
Expected: May show files that need formatting (expected)

- [ ] **Step 6: Commit**

```bash
git add prettier.config.js .prettierignore package.json package-lock.json
git commit -m "chore: add Prettier configuration"
```

---

### Task 4: Format Codebase with Prettier

**Files:**

- Multiple files (formatting only)

- [ ] **Step 1: Run Prettier on all files**

Run: `npm run format`
Expected: All files formatted

- [ ] **Step 2: Verify formatting**

Run: `npm run format:check`
Expected: All files pass (exit code 0)

- [ ] **Step 3: Verify tests still pass**

Run: `npm run test`
Expected: All 24 tests pass

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: format codebase with Prettier"
```

---

### Task 5: Remove Legacy AiModel.jsx

**Files:**

- Delete: `configs/AiModel.jsx`
- Modify: any files importing from it

- [ ] **Step 1: Find all imports of configs/AiModel.jsx**

Run: `grep -r "configs/AiModel" --include="*.{js,jsx,ts,tsx}" .`
Expected: List of files importing from legacy config

- [ ] **Step 2: Update imports to use server/ai/models.ts**

For each file found, update the import to use `server/ai/models.ts` instead.

The new model factory provides `getModel()` and `aiModel` export.

- [ ] **Step 3: Delete configs/AiModel.jsx**

Run: `rm configs/AiModel.jsx`

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Verify tests still pass**

Run: `npm run test`
Expected: All 24 tests pass

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove legacy configs/AiModel.jsx"
```

---

### Task 6: Verify Quality Gates

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run ESLint**

Run: `npm run lint`
Expected: No errors (warnings acceptable)

- [ ] **Step 3: Run Prettier check**

Run: `npm run format:check`
Expected: All files pass

- [ ] **Step 4: Run tests**

Run: `npm run test`
Expected: All 24 tests pass

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: Build succeeds

---

## Summary

| Task | Description              | Changes         |
| ---- | ------------------------ | --------------- |
| 1    | TypeScript config update | tsconfig.json   |
| 2    | Fix TypeScript errors    | Multiple files  |
| 3    | Prettier setup           | 3 new files     |
| 4    | Format codebase          | Formatting only |
| 5    | Remove legacy code       | Delete 1 file   |
| 6    | Verify quality gates     | All checks pass |
