# Backend Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend

# Build the application
WORKDIR /app/apps/backend
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for workspace setup
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application and necessary runtime files
COPY --from=base /app/apps/backend/dist ./apps/backend/dist
COPY --from=base /app/apps/backend/loader.js ./apps/backend/
COPY --from=base /app/apps/backend/drizzle.config.ts ./apps/backend/
COPY --from=base /app/apps/backend/src/db/migrations ./apps/backend/src/db/migrations

# Copy environment template (will be overridden by Docker environment)
COPY apps/backend/.env.example ./apps/backend/.env.example

# Expose port
EXPOSE 4000

# Set working directory to backend
WORKDIR /app/apps/backend

# Start the application
CMD ["node", "dist/server.js"]