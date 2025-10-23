# Production Environment Template for Coolify

## Backend Environment Variables
```
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://exp_prod:CHANGE_THIS_PASSWORD@your-db-host:5432/evenly_prod
JWT_SECRET=CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_AT_LEAST_32_CHARS
CORS_ORIGIN=https://your-frontend-domain.com
API_VERSION=v1
```

## Frontend Environment Variables
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_APP_NAME=Evenly
NEXT_PUBLIC_APP_VERSION=0.1.0
```

## Coolify App Configuration

### Backend App
- **Name:** evenly-backend
- **Build Pack:** Docker
- **Dockerfile Path:** apps/backend/Dockerfile
- **Port:** 4000
- **Health Check Path:** /health
- **Domain:** api.yourdomain.com

### Frontend App
- **Name:** evenly-frontend
- **Build Pack:** Docker
- **Dockerfile Path:** apps/frontend/Dockerfile
- **Port:** 3000
- **Health Check Path:** /
- **Domain:** yourdomain.com

## GitHub Secrets Required
```
COOLIFY_TOKEN=your_coolify_api_token
COOLIFY_API_URL=https://your-coolify-instance.com
COOLIFY_BACKEND_APP_ID=backend_app_uuid
COOLIFY_FRONTEND_APP_ID=frontend_app_uuid
```

## Database Setup Script
```sql
-- Connect as superuser first
CREATE ROLE exp_prod LOGIN PASSWORD 'secure_production_password';
CREATE DATABASE evenly_prod OWNER exp_prod;
GRANT ALL PRIVILEGES ON DATABASE evenly_prod TO exp_prod;

-- Test connection
\c evenly_prod exp_prod
```

## Post-Deployment Checklist
- [ ] SSL certificates configured
- [ ] Environment variables set
- [ ] Database connection working
- [ ] Health checks passing
- [ ] CORS headers correct
- [ ] GitHub webhooks configured
- [ ] Backup strategy in place