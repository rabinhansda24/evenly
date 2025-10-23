# High-Level Design (HLD) – Expense Split Calculator

This HLD captures the system context, containers, deployment topology, and key runtime interactions (request + realtime update flow). Diagrams are provided in **Mermaid** so you can view them in GitHub, VS Code, or any Mermaid renderer.

---

## 1) System Context (C4 Level 1)

```mermaid
flowchart LR
  user["End User<br/>(Browser)"]:::actor
  subgraph Internet
    fe["Frontend (Next.js App Router)"]:::svc
    be["Backend API (Express + TS)"]:::svc
  end
  db[(PostgreSQL)]:::db

  user -->|HTTPS| fe
  fe -->|"REST (JSON), Auth (JWT HttpOnly)"| be
  fe -.->|"SSE (EventSource)"| be
  be -->|"SQL (Drizzle ORM)"| db

  classDef actor fill:#f6f9ff,stroke:#3b82f6,stroke-width:1px,color:#0b3a8f;
  classDef svc fill:#eefcf3,stroke:#10b981,stroke-width:1px,color:#064e3b;
  classDef db fill:#fff7ed,stroke:#f59e0b,stroke-width:1px,color:#8a3b00;
```

**Notes**
- Users access the **Next.js** frontend which talks to the **Express** backend via REST and subscribes to **SSE** for realtime updates.
- The backend persists data in **PostgreSQL** through **Drizzle ORM** and emits SSE events to connected clients.

---

## 2) Container Diagram (C4 Level 2)

```mermaid
graph TD
  subgraph Client
    B["Browser<br/>React Components + Redux Toolkit + RTK Query"]
  end

  subgraph Coolify Host
    subgraph Frontend App
      FE["Next.js App Router<br/>SSR/SSG + Static Assets"]
    end

    subgraph Backend App
      API["Express Controllers + Zod Validation"]:::svc
      SVC["Domain Services<br/>Auth/Groups/Expenses/Settlements"]:::svc
      SSE["SSE Stream Manager<br/>(publish/subscribe per group)"]:::svc
      DAL[Drizzle ORM + Repositories]:::svc
    end

    PG[(PostgreSQL Instance<br/>expenses_dev / expenses_prod)]:::db
  end

  B -->|HTTP| FE
  FE -->|REST JSON| API
  B -.->|SSE| SSE
  API --> SVC
  SVC --> DAL --> PG

  classDef svc fill:#eefcf3,stroke:#10b981,stroke-width:1px,color:#064e3b;
  classDef db fill:#fff7ed,stroke:#f59e0b,stroke-width:1px,color:#8a3b00;
```

**Responsibilities**
- **API**: routing, validation, auth guards.
- **Services**: business logic (splits, balances, settlements).
- **DAL**: schema, migrations, queries.
- **SSE**: manages group streams, heartbeats, event fan-out.

---

## 3) Deployment Topology

```mermaid
flowchart TB
  subgraph GitHub
    GH["Monorepo<br/>apps/frontend + apps/backend"]
    WF1["deploy-frontend.yml"]
    WF2["deploy-backend.yml"]
  end

  subgraph Coolify
    CF["Coolify Controller"]
    CFE["Frontend App"]
    CBE["Backend App"]
    DB["(PostgreSQL<br/>expenses_dev & expenses_prod)"]
  end

  GH -->|"Path-filtered webhook<br/>(curl deploy API)"| CF
  CF -->|Rebuild & Redeploy| CFE
  CF -->|Rebuild & Redeploy| CBE
  CBE --- DB
  CFE -->|HTTPS| Users

  Users([Users]):::actor --> CFE

  classDef actor fill:#f6f9ff,stroke:#3b82f6,stroke-width:1px,color:#0b3a8f;
```

**Key Points**
- Two independent Coolify applications (frontend/backend) enable **selective deploys**.
- One Postgres instance hosts **two databases**: `expenses_dev` and `expenses_prod` (separate credentials).

---

## 4) Runtime – Expense Creation Flow (Sequence)

```mermaid
sequenceDiagram
  autonumber
  participant U as User (Browser)
  participant FE as Frontend (Next.js)
  participant BE as Backend (Express API)
  participant DB as PostgreSQL
  participant SSE as SSE Stream

  U->>FE: Submit "Add Expense" form
  FE->>BE: POST /api/groups/:id/expenses {desc, amount, paidBy, participants}
  BE->>BE: Validate (Zod), AuthZ (member of group?)
  BE->>DB: Insert Expense + Participants (transaction)
  DB-->>BE: OK (expense_id)
  BE->>SSE: publish(groupId,'expense_created', dto)
  BE-->>FE: 201 Created {expense}
  Note over U,FE: UI updates (optimistic or response-driven)
  SSE-->>U: event: expense_created (other members notified in real-time)
```

---

## 5) Runtime – Settlement Flow (Sequence)

```mermaid
sequenceDiagram
  autonumber
  participant U as User (Browser)
  participant FE as Frontend (Next.js)
  participant BE as Backend (Express API)
  participant DB as PostgreSQL
  participant SSE as SSE Stream

  U->>FE: Click "Settle Up"
  FE->>BE: POST /api/groups/:id/settlements {from,to,amount}
  BE->>BE: Validate & check balances
  BE->>DB: Insert settlement (transaction)
  DB-->>BE: OK (settlement_id)
  BE->>SSE: publish(groupId,'settlement_created', dto)
  BE-->>FE: 201 Created {settlement}
  SSE-->>U: event: settlement_created (group peers updated)
```

---

## 6) Cross-Cutting Concerns

- **Security**: bcrypt password hashing; JWT in HttpOnly cookies; CORS allow-list; input validation with Zod; least-privilege DB users.
- **Observability**: structured logs; request ids; basic health checks (`/health`).
- **SSE Hardening**: headers (`Content-Type: text/event-stream`, `X-Accel-Buffering: no`), 25s heartbeats, long proxy read timeouts.
- **Migrations**: Drizzle SQL migrations tracked in VCS; manual prod apply via container shell.
- **Backups**: Coolify Postgres daily backups before prod migrations.