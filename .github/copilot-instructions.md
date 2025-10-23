# GitHub Copilot – Project Instructions (Evenly)

You are assisting on **Evenly**, a monorepo app (Next.js App Router + Redux + Tailwind + shadcn/ui; Express + TypeScript + Drizzle + PostgreSQL; SSE for realtime). Generate only the code and tests necessary to implement features **strictly using TDD**, one end‑to‑end feature at a time.

---

## Prime Directives

1) **TDD Loop – No exceptions**
- **Red 1:** Write a failing test. Run it and confirm it fails. **Commit**: `test: add failing <scope> test`
- **Green 1:** Write the **minimum** code to pass. **Commit**: `feat: make <scope> test pass (minimum)`
- **Red 2:** Add another failing test (edge/integration/e2e). **Commit**: `test: add failing <scope> test (edge)`
- **Green 2:** Write **production** code to pass all tests. **Commit**: `feat: productionize <scope>`
- **Refactor:** Improve design without changing behavior. **Commit**: `refactor: <scope>`

2) **End‑to‑End per feature**
Ship **backend + frontend + tests + docs** for a feature **before** starting the next. Frontend must be responsive (sm/md/lg) and load properly across device sizes.

3) **Small, verifiable steps**
Only generate what the current failing tests demand. No speculative abstractions.

---

## Test Layout & Naming

### Backend (Express + TS)
- Place tests **next to the module**:
  - `apps/backend/src/modules/<feature>/tests/unittest/*.spec.ts`
  - `apps/backend/src/modules/<feature>/tests/integration/*.spec.ts`
- Example: `apps/backend/src/modules/auth/tests/unittest/register.spec.ts`

**Backend Vitest config expectations**
- Environment: `node`
- Coverage: `>= 80%` lines/branches per package
- Suggested `testMatch` globs (implicit via scripts):
  - Unit: `src/**/tests/unittest/*.spec.ts`
  - Integration: `src/**/tests/integration/*.spec.ts`

### Frontend (Next.js + Redux)
- Organize by **feature** and co‑locate tests:
  - `apps/frontend/src/features/<feature>/tests/unittest/*.spec.tsx`
  - `apps/frontend/src/features/<feature>/tests/integration/*.spec.tsx`
- For route UI under `app/`, create a sibling `tests` folder:
  - `apps/frontend/app/(auth)/login/tests/unittest/*.spec.tsx`

**Frontend Vitest config expectations**
- Environment: `jsdom`
- Use `@testing-library/react` for component tests
- Coverage: `>= 80%`

### End‑to‑End (Playwright)
- Locate e2e specs by feature:
  - `apps/frontend/e2e/<feature>.spec.ts`
- Projects: **desktop** (1280×800) and **mobile** (iPhone 12)
- Base URL from `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`)

---

## Test Commands

### Backend
- Run all tests: `pnpm -C apps/backend test`
- Unit only: `pnpm -C apps/backend test:unit`
- Integration only: `pnpm -C apps/backend test:integration`

### Frontend
- Run all unit/integration (Vitest): `pnpm -C apps/frontend test`
- E2E (Playwright, add as needed): `pnpm -C apps/frontend test:e2e`

---

## CI Expectations

- Lint, typecheck, and run tests package‑wise.
- Ensure coverage `>= 80%` or fail.
- Playwright runs **headless** for **desktop** and **mobile** profiles.
- If e2e tests hit the API, start backend first or stub network in tests:
  - Start backend (example): `pnpm -C apps/backend build && node apps/backend/dist/server.js &`
  - Wait for `http://localhost:4000/health` before launching Playwright.

---

## Definition of Done (DoD)

- ✅ Backend: routes, services, repos, Zod validators, auth/membership guards, error shape.
- ✅ Frontend: responsive pages/components/hooks wired to real API.
- ✅ Realtime: SSE client dispatches updates where relevant.
- ✅ Tests: unit + integration + e2e (at least 2 edge cases).
- ✅ Docs: usage & API notes in README or dedicated md.
- ✅ Migrations: generated & committed (dev applied; prod manual).

---

## What to Generate per Feature

For the **current feature**, output **only the next TDD step** with:
- The exact command to run (unit/integration/e2e).
- File paths using the layout above.
- Full code blocks for created/changed files.
- A short note of the expected failure/success.

### Example kick‑off (*Auth: Registration & Login*)

**Red 1 — backend unit (module‑local):**
- Create: `apps/backend/src/modules/auth/tests/unittest/register.spec.ts`
- Command: `pnpm -C apps/backend test:unit` → expect **FAIL**
- Commit: `test(auth): add failing unit tests for registration`

**Green 1 — backend minimum:**
- Implement minimal service in `apps/backend/src/modules/auth/...` to pass unit tests.
- Command: `pnpm -C apps/backend test:unit` → expect **PASS**
- Commit: `feat(auth): minimal registration service to pass unit tests`

**Red 2 — backend integration + frontend unit (form):**
- Add route tests in `.../tests/integration/register.route.spec.ts`
- Add UI component test in `apps/frontend/src/features/auth/tests/unittest/login-form.spec.tsx`
- Commands:  
  `pnpm -C apps/backend test:integration && pnpm -C apps/frontend test` → expect **FAIL**
- Commit: `test(auth): failing API + UI tests for registration/login`

**Green 2 — production code (backend routes + frontend page):**
- Implement Express routes, cookies; Next.js login page; wire Redux.
- Commands: `pnpm -C apps/backend test && pnpm -C apps/frontend test` → **PASS**
- Commit(s):  
  `feat(auth): routes + cookie auth`  
  `feat(ui-auth): responsive login page (+RTL tests)`

**Refactor:** keep tests green.

---

## Guardrails for Copilot

- Don't implement future features. Only what failing tests require.
- Don't bypass auth except where a test explicitly sets context.
- Don't store computed balances; always derive.
- Don't auto‑apply migrations to prod.
- Prefer pure functions for business logic; keep I/O at edges.

---

## Current Focus

**Feature:** *Auth: Registration & Login*  
**Next Step:** Generate **Red 1** only using the module‑local test layout above. Stop after writing the failing tests and the exact command to run.