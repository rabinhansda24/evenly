# Evenly 💰

> **A modern expense-splitting application for groups, teams, and roommates**

Evenly is a full-stack TypeScript application that helps groups track shared expenses and manage settlements transparently. Built with scalability and real-time collaboration in mind.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)

## ✨ Features

- 👥 **Group Management**: Create and manage expense-sharing groups
- 💳 **Smart Expense Splitting**: Equal splits with future support for custom weights
- 🔄 **Real-time Updates**: Live synchronization using Server-Sent Events (SSE)
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🔐 **Secure Authentication**: JWT-based auth with HttpOnly cookies
- 💾 **Reliable Data**: PostgreSQL with derived balances (no data drift)
- 🐳 **Containerized**: Docker-ready for easy deployment

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router) + Redux Toolkit + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript + Zod validation
- **Database**: PostgreSQL + Drizzle ORM
- **Real-time**: Server-Sent Events (SSE)
- **Testing**: Vitest for unit/integration tests
- **Deployment**: Docker + Coolify (self-hosted)

### Project Structure
```
evenly/
├── apps/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules (auth, groups, expenses)
│   │   │   └── server.ts # Main server file
│   │   └── Dockerfile    # Backend containerization
│   └── frontend/         # Next.js application
│       ├── app/          # App Router pages
│       └── Dockerfile    # Frontend containerization
├── docs/                 # Documentation
├── .github/              # CI/CD workflows
└── docker-compose.yml    # Local development
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+
- **pnpm** (recommended) or npm
- **PostgreSQL** (for production) or Docker

### Development Setup

1. **Clone the repository**
   ```bash
   git clone git@github.com:rabinhansda24/evenly.git
   cd evenly
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development servers**
   ```bash
   # Terminal 1: Backend (Port 4000)
   pnpm dev:backend
   
   # Terminal 2: Frontend (Port 3000)
   pnpm dev:frontend
   ```

4. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:4000
   - **Health Check**: http://localhost:4000/health

### Docker Development

For a complete development environment with PostgreSQL:

```bash
# Start all services
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/invite` - Invite user to group

### Expenses
- `POST /api/groups/:id/expenses` - Add new expense
- `GET /api/groups/:id/expenses` - List group expenses

### Real-time
- `GET /api/groups/:id/stream` - SSE stream for live updates

## 🧪 Testing

### Run Tests
```bash
# All tests
pnpm test

# Backend tests only
pnpm -C apps/backend test

# Frontend tests only
pnpm -C apps/frontend test

# With coverage
pnpm -C apps/backend test --coverage
```

### Test Structure
- **Unit Tests**: `src/**/tests/unittest/*.spec.ts`
- **Integration Tests**: `src/**/tests/integration/*.spec.ts`
- **E2E Tests**: `apps/frontend/e2e/*.spec.ts`

## 🐳 Deployment

### Local Production Testing
```bash
# Build and run production containers
pnpm docker:build
pnpm prod:up
```

### Coolify Deployment

1. **Set up environment variables** using provided templates:
   - `apps/backend/.env.example`
   - `apps/frontend/.env.example`

2. **Configure GitHub secrets**:
   ```
   COOLIFY_TOKEN=<your_coolify_api_token>
   COOLIFY_API_URL=<your_coolify_instance>
   COOLIFY_BACKEND_APP_ID=<backend_app_id>
   COOLIFY_FRONTEND_APP_ID=<frontend_app_id>
   ```

3. **Deploy**:
   ```bash
   git push origin master
   ```

Automatic deployments trigger on:
- Backend changes: `apps/backend/**`
- Frontend changes: `apps/frontend/**`

## 📖 Documentation

- 📋 [Project Report](docs/project-report.md) - Complete project overview
- 🏗️ [High-Level Design](docs/hld-evenly.md) - System architecture
- 🔧 [Low-Level Design](docs/lld-evenly.md) - Implementation details
- 🚀 [Deployment Guide](docs/deployment-guide.md) - Complete deployment instructions
- 🐳 [Docker Setup](docs/docker-deployment-summary.md) - Containerization guide
- 🤖 [Copilot Instructions](.github/copilot-instructions.md) - TDD development workflow

## 🛠️ Available Scripts

### Root Level
```bash
pnpm dev:backend          # Start backend development server
pnpm dev:frontend         # Start frontend development server
pnpm docker:up            # Start all services with Docker
pnpm docker:down          # Stop Docker services
pnpm docker:build         # Build Docker images
pnpm test                 # Run all tests
pnpm build                # Build all applications
```

### Backend Specific
```bash
pnpm -C apps/backend dev          # Development server
pnpm -C apps/backend test         # All tests
pnpm -C apps/backend test:unit    # Unit tests only
pnpm -C apps/backend test:integration  # Integration tests only
pnpm -C apps/backend build        # Build for production
```

### Frontend Specific
```bash
pnpm -C apps/frontend dev         # Development server
pnpm -C apps/frontend build       # Build for production
pnpm -C apps/frontend test        # Run tests
```

## 🏛️ Architecture Decisions

Key architectural decisions are documented in [Architecture Decision Records (ADR)](docs/adr/):

- [ADR-0003: API Style Choice](docs/adr/0003-api-style.md) - Why REST + SSE over GraphQL

## 🔧 Development Philosophy

This project follows **Test-Driven Development (TDD)**:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while keeping tests green

See [Copilot Instructions](.github/copilot-instructions.md) for detailed development workflow.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the TDD workflow
4. Commit your changes: `git commit -m 'feat: add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Commit Convention
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/modifications
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♀️ Support

- 📧 **Issues**: [GitHub Issues](https://github.com/rabinhansda24/evenly/issues)
- 📖 **Documentation**: [docs/](docs/)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/rabinhansda24/evenly/discussions)

---

**Built with ❤️ for transparent expense sharing**