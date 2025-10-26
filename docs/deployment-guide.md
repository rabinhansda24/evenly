# Deployment Guide - Evenly

This guide covers local development, Docker containerization, and Coolify production deployment.

## 🏠 Local Development

### Prerequisites
- Node.js 20+
- pnpm
- PostgreSQL (optional, can use Docker)

### Quick Start
```bash
# Clone and install dependencies
git clone <repository>
cd evenly
npx pnpm install

# Start backend (Terminal 1)
npx pnpm -C apps/backend dev

# Start frontend (Terminal 2)
npx pnpm -C apps/frontend dev
```

**Available at:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Backend Health: http://localhost:4000/health

## 🐳 Docker Development

### Using Docker Compose
```bash
# Start all services (frontend, backend, postgres)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Docker Builds
```bash
# Build backend
docker build -f apps/backend/Dockerfile -t evenly-backend .

# Build frontend
docker build -f apps/frontend/Dockerfile -t evenly-frontend .

# Run backend
docker run -p 4000:4000 evenly-backend

# Run frontend
docker run -p 3000:3000 evenly-frontend
```

## 🚀 Production Deployment (Coolify)

### Setup Overview
1. **Two separate Coolify applications:**
   - `evenly-backend` (Express API)
   - `evenly-frontend` (Next.js App)

2. **Database:**
   - PostgreSQL instance with separate dev/prod databases
   - Credentials: `exp_dev`/`exp_prod` roles

3. **Auto-deployment:**
   - GitHub webhooks trigger Coolify deployments
   - Path-filtered: backend/frontend deploy independently

### Environment Variables

#### Backend (.env)
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://exp_prod:password@host:5432/evenly_prod
JWT_SECRET=super-secret-production-key
CORS_ORIGIN=https://evenly.yourdomain.com
# If your provider requires SSL (Neon/Supabase/managed PG), enable it:
# Accepts: require|true|1 (maps to postgres-js ssl: 'require')
DATABASE_SSL=require
# Optional timeouts/pool tuning (seconds)
# DB_CONNECT_TIMEOUT=30
# DB_IDLE_TIMEOUT=30
# DB_POOL_MAX=20
```

#### Frontend (.env)
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.evenly.yourdomain.com
NEXT_PUBLIC_APP_NAME=Evenly
```

### Coolify Configuration

#### Backend App
- **Build Pack:** Docker
- **Dockerfile:** `apps/backend/Dockerfile`
- **Base directory:** `/apps/backend` (if Coolify asks for it)
- **Port:** 4000
- **Health Check:** `/health`
- **Environment:** Production variables above

#### Frontend App
- **Build Pack:** Docker
- **Dockerfile:** `apps/frontend/Dockerfile`
- **Base directory:** `/apps/frontend` (if Coolify asks for it)
- **Port:** 3000
- **Health Check:** `/` (Next.js default)
- **Environment:** Production variables above

### Database Setup

#### Create Roles and Databases
```sql
-- Production
CREATE ROLE exp_prod LOGIN PASSWORD 'secure-production-password';
CREATE DATABASE evenly_prod OWNER exp_prod;

-- Development
CREATE ROLE exp_dev LOGIN PASSWORD 'development-password';
CREATE DATABASE evenly_dev OWNER exp_dev;
```

#### Grant Permissions
```sql
GRANT ALL PRIVILEGES ON DATABASE evenly_prod TO exp_prod;
GRANT ALL PRIVILEGES ON DATABASE evenly_dev TO exp_dev;
```

### Migration Strategy

#### Development
```bash
# Generate migration
npx pnpm -C apps/backend migrate:gen

# Apply migration
npx pnpm -C apps/backend migrate:apply
```

#### Production
```bash
# Manual trigger via Coolify shell
npx pnpm migrate:prod
```

> ⚠️ **Important:** Always backup database before production migrations!

### Deployment Workflow

#### Automatic Deployment
1. **Push to main branch**
2. **GitHub Actions detect changes:**
   - `apps/backend/**` → Triggers backend deployment
   - `apps/frontend/**` → Triggers frontend deployment
3. **Coolify receives webhook**
4. **Coolify builds and deploys Docker containers**

#### Manual Deployment
```bash
# Trigger via GitHub Actions (requires secrets)
curl -X POST "https://coolify.yourdomain.com/api/v1/applications/{APP_ID}/deploy" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Monitoring & Health Checks

#### Health Endpoints
- **Backend:** `GET /health` → `{"status":"ok"}`
- **Frontend:** `GET /` → Next.js app loads

#### Logs
```bash
# Coolify container logs
docker logs <container-id>

# Application logs (structured JSON)
{"level":"info","module":"server","msg":"Server started","port":4000}
```

### SSL & Domains

#### Coolify SSL
- **Automatic:** Let's Encrypt integration
- **Custom:** Upload certificates via Coolify UI

#### Domain Configuration
- **Frontend:** `evenly.yourdomain.com`
- **Backend:** `api.evenly.yourdomain.com`
- **CORS:** Update `CORS_ORIGIN` to match frontend domain

### Backup Strategy

#### Database Backups
```bash
# Daily automated backups via Coolify
# Manual backup
pg_dump -U exp_prod -h host evenly_prod > backup_$(date +%Y%m%d).sql
```

#### Application Backups
- **Git:** Source code version control
- **Environment:** Backup environment variables
- **Coolify:** Configuration export

### Troubleshooting

#### Common Issues
1. **Build Failures:**
   - Check Dockerfile syntax
   - Verify dependencies in package.json
   - Review build logs in Coolify

2. **Database Connection:**
   - Verify DATABASE_URL format
   - Check database credentials
   - Ensure database server is accessible from your Coolify host (firewall/allowlist)
   - If using managed PG that enforces TLS, set `DATABASE_SSL=require`
   - For slow networks, increase `DB_CONNECT_TIMEOUT` (default 20s in app)
   - Prefer internal hostnames if using Coolify-managed Postgres

3. **CORS Errors:**
   - Update CORS_ORIGIN environment variable
   - Check frontend API URL configuration

#### Debug Commands
```bash
# Check container health
docker ps
docker logs <container-id>

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# If SSL is required, psql might need this as well
# (or append ?sslmode=require to the URL just for testing)
# psql "${DATABASE_URL}?sslmode=require" -c "SELECT 1;"

# Test API endpoints
curl http://localhost:4000/health
```

### Security Checklist

- [ ] Strong JWT_SECRET in production
- [ ] Database credentials rotated
- [ ] CORS configured correctly
- [ ] HTTPS enabled (Coolify SSL)
- [ ] Environment variables secured
- [ ] Container images updated regularly
- [ ] Database backups automated
- [ ] Access logs monitored

## 📚 Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express Production Best Practices](https://expressjs.com/en/advanced/best-practice-production.html)