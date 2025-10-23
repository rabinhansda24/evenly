# Evenly – Complete Project Report

## 1. Overview
Evenly is an expense‑splitting web application designed for groups of friends, teams, and roommates who share costs and need a transparent, automated way to track and settle balances. The system enables users to create groups, record expenses, define who paid and who owes, and manage settlements. It's engineered for scalability and long‑term extensibility.

---

## 2. Architecture Summary
**Stack Overview**
- **Frontend:** Next.js (App Router) + Redux Toolkit + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript + Drizzle ORM
- **Database:** PostgreSQL (Coolify-hosted, with separate dev and prod DBs)
- **Realtime:** Server‑Sent Events (SSE) for push updates
- **Deployment:** Self‑hosted on Coolify (Hetzner VPS)
- **Version Control:** Monorepo (frontend + backend) with Docker Compose for local dev
- **CI/CD:** Coolify auto‑deploy on branch push (manual migrations)

---

## 3. API Design Decision – REST + SSE
Evenly uses **RESTful APIs** instead of GraphQL. The reasons are pragmatic:
- Data model is resource‑centric (users, groups, expenses, settlements).
- SSE integrates naturally with REST endpoints for realtime updates.
- REST aligns with RTK Query in Redux Toolkit.
- GraphQL's subscription complexity (WebSocket infra, resolver overhead) is unnecessary for Evenly's scope.

A future enhancement could expose a read‑only GraphQL layer for analytics and reporting.

**API Highlights**
- REST base path: `/api`
- Auth: JWT (HttpOnly cookies)
- Versioning: Path prefix (`/api/v1`)
- Realtime: `GET /groups/:groupId/stream` (SSE)
- OpenAPI documentation generated from Zod schemas.

---

## 4. Database Design

### 4.1 Normalization & Integrity
Evenly follows **3rd Normal Form (3NF)**. No derived balances are stored; they're computed from transactions. The schema enforces referential integrity and positive amount constraints.

**Key Constraints**
- `UNIQUE` on natural identifiers (`email`, `(group_id, user_id)`).
- `CHECK` for nonnegative `amount` and `share`.
- `FOREIGN KEY` relationships with `ON DELETE CASCADE` or `RESTRICT` policies.
- Transactional inserts for expenses and settlements to maintain data consistency.

### 4.2 Core Tables
| Table | Purpose |
|-------|----------|
| `users` | Authentication, identity, profile info |
| `groups` | Logical container for shared expenses |
| `group_members` | Many‑to‑many link between users and groups |
| `expenses` | Expense metadata and payer info |
| `expense_participants` | Each participant's share for an expense |
| `settlements` | Manual settlements between users |
| `group_split_weights` | (Future) Default weighting for group members |

### 4.3 Future-Proof Split Support
From day one, Evenly supports flexible splitting via two additive columns:

```sql
split_mode VARCHAR(16) NOT NULL DEFAULT 'equal';  -- 'equal' | 'weights' | 'fixed'
weight NUMERIC(8,4);  -- per participant, nullable in v1
```

- v1 uses only `split_mode='equal'`, `weight=NULL`.
- Future updates can activate proportional or fixed custom splits without schema changes.

### 4.4 Indexing Strategy
```sql
CREATE UNIQUE INDEX uq_users_email ON users(email);
CREATE UNIQUE INDEX uq_group_user ON group_members(group_id, user_id);
CREATE INDEX ix_expenses_group_created ON expenses(group_id, created_at DESC);
CREATE INDEX ix_settlements_group_created ON settlements(group_id, created_at DESC);
CREATE INDEX ix_settlements_parties ON settlements(from_user_id, to_user_id);
```

Indexes target typical filters: group feeds, expense history, settlements.

---

## 5. Migration Policy
**Local development**
```bash
pnpm -C apps/backend migrate:gen
pnpm -C apps/backend migrate:apply
```

**Production**
Manual trigger via Coolify shell (Option 1 policy):
```bash
pnpm migrate:prod
```
Coolify automatically redeploys backend/frontend independently (selective deploy strategy). Migrations are committed to git and run explicitly in production to avoid corruption risk.

---

## 6. Frontend Architecture

### Framework
- **Next.js (App Router)** for modular routing and server‑side rendering.
- **Redux Toolkit** for predictable global state.
- **Tailwind CSS + shadcn/ui** for a clean, reusable component library.

### Directory Structure
```
apps/frontend/
  ├── app/
  │   ├── (auth)/login/
  │   ├── groups/[id]/
  │   └── page.tsx
  ├── components/ui/
  ├── store/ (Redux slices)
  ├── lib/sseClient.ts (SSE abstraction)
  └── tailwind.config.ts
```

### Realtime Integration (SSE)
Each group page subscribes to `GET /groups/:id/stream`. On server events:
- `expense_created` → Redux dispatches `expenses/addOne`
- `settlement_created` → Redux dispatches `settlements/addOne`
This ensures all members see updates without refresh.

---

## 7. Backend Architecture

### Express + TypeScript
Backend follows **modular service architecture**:
```
apps/backend/
  ├── src/
  │   ├── modules/
  │   │   ├── auth/
  │   │   ├── groups/
  │   │   ├── expenses/
  │   │   ├── settlements/
  │   ├── db/
  │   ├── middlewares/
  │   ├── utils/
  │   └── server.ts
```

**Drizzle ORM** provides typed schema, migrations, and query safety.  
**Zod** validates all inputs/outputs at runtime.  
**JWT middleware** handles authentication with role‑based checks for group membership.

---

## 8. Realtime Data Flow
### Expense Creation Sequence
1. Frontend posts new expense via `/groups/:id/expenses`.
2. Backend validates request, opens transaction.
3. Inserts into `expenses` → `expense_participants`.
4. Emits SSE event `expense_created` to all group subscribers.
5. Clients update Redux state instantly.

### Settlement Flow
Similar flow with `settlement_created` SSE events.

---

## 9. Database Setup Instructions
1. Create roles and databases:
```sql
CREATE ROLE exp_dev LOGIN PASSWORD 'replace_me_dev';
CREATE ROLE exp_prod LOGIN PASSWORD 'replace_me_prod';
CREATE DATABASE evenly_dev OWNER exp_dev;
CREATE DATABASE evenly_prod OWNER exp_prod;
```
2. Configure environment variables:
```
DATABASE_URL=postgres://exp_dev:.../evenly_dev
```
3. Run initial migrations using the provided SQL:
```bash
psql -U exp_dev -d evenly_dev -f evenly_initial_schema.sql
```

---

## 10. Security Practices
- JWTs stored in **HttpOnly cookies**.
- CORS allowlist for frontend origin only.
- Passwords hashed using bcrypt.
- Separate DB roles for dev and prod.
- No auto‑migrations in production.

---

## 11. Scalability Considerations
- All schemas and tables support future weighting splits.
- Backend modularity allows microservice decomposition (Auth, Expenses).
- SSE is lightweight; can later upgrade to WebSockets if scaling demands bidirectional comms.
- Indexes support feed pagination by `(created_at, id)` cursor.
- Future read scaling: read replicas or caching with Redis.

---

## 12. Documentation and Deliverables

### Key Files
- `/docs/project-report.md` (this document)
- `/docs/hld-evenly.md` (system diagrams)
- `/docs/lld-evenly.md` (module-level details)
- `/docs/adr/0003-api-style.md` (REST vs GraphQL decision)
- `/schema/evenly_initial_schema.sql` (DB schema)
- `/src/db/schema.ts` (Drizzle definitions)

### Diagrams
- **HLD:** system context, container, deployment, sequence diagrams.
- **LLD:** module-level class structure and interaction diagrams.

---

## 13. Next Steps (Phase 2)
- Implement user invitations and join links.
- Add analytics dashboard for per-group spending insights.
- Integrate optional Stripe Connect for real settlements.
- Add mobile‑optimized views (Next.js responsive layout).
- Optionally enable weight/fixed split logic using existing schema columns.

---

**Summary:**  
Evenly is engineered with pragmatic scalability: REST + SSE for realtime, TypeScript + Drizzle for type safety, and a database schema that supports both equal and custom splits from day one — without future-breaking migrations.