# ADR 0001 – Architecture and Stack Selection

**Status:** Accepted  
**Date:** 2025-10-24  

## Context
We needed a modern, developer-friendly stack that supports rapid feature iteration under a strict TDD process while being easy to deploy on a self-hosted environment (Coolify). The application should support both frontend and backend in a single repository, maintain strong type safety, and provide predictable builds.

## Decision
- **Monorepo:** `pnpm` workspaces with `/apps/backend` and `/apps/frontend`.
- **Backend:** Node.js + Express + TypeScript + Drizzle ORM + PostgreSQL.
- **Frontend:** Next.js (App Router) + Redux Toolkit + Tailwind CSS + shadcn/ui.
- **Realtime:** Server-Sent Events (SSE) instead of WebSockets for simplicity and statelessness.
- **Infrastructure:** Coolify self-hosted environment with GitHub Actions for selective deployments (backend vs frontend).
- **Testing:** Vitest + Supertest + Playwright under strict TDD (Red-Green-Refactor).
- **Database:** Two PostgreSQL instances (local dev and production) hosted on Coolify.
- **Schema:** Future-proof schema supporting both equal and custom splits (default = equal).
- **CI/CD:** Coolify deploys triggered via GitHub workflow paths.

## Consequences
- Enables full-stack development within a single repo.
- Simplifies deployments and environment management.
- Enforces TDD discipline and modular development.
- Keeps the system lightweight while ready for scaling.
- Improves onboarding and contribution clarity for open-source release.
