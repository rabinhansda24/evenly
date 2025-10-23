# Backend Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

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
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=base /app/apps/backend/dist ./apps/backend/dist

# Expose port
EXPOSE 4000

# Set working directory to backend
WORKDIR /app/apps/backend

# Start the application
CMD ["node", "dist/server.js"]