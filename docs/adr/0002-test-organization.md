# ADR 0002 – Test Organization and TDD Enforcement

**Status:** Accepted  
**Date:** 2025-10-24  

## Context
We needed a consistent, scalable test layout that aligns with the Copilot-driven TDD workflow. Tests must live close to the production code for better maintainability and run seamlessly in both local and CI environments.

## Decision
- Each module maintains its own test directories:
  - `tests/unittest/` — for DTOs, validation, and isolated logic.
  - `tests/integration/` — for routes, DB integration, and service orchestration.
- Frontend mirrors this under `src/features/<module>/tests/`.
- E2E tests live in `apps/frontend/e2e/`.
- Commands standardized as:
  - `pnpm -C apps/backend test:unit`
  - `pnpm -C apps/backend test:integration`
  - `pnpm -C apps/frontend test`
  - `pnpm -C apps/frontend test:e2e`
- CI enforces coverage ≥ 80% and fails below threshold.
- Commit pattern enforces TDD: **Red → Green → Refactor**.

## Consequences
- Tests are colocated with their source, simplifying maintenance.
- Developers follow consistent test discovery and execution rules.
- CI ensures uniform coverage tracking and validation.
- Reduces risk of regression by enforcing TDD across backend and frontend.
