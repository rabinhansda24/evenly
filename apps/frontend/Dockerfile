# Frontend Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/frontend ./apps/frontend

# Build the application
WORKDIR /app/apps/frontend
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=base /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=base /app/apps/frontend/public ./apps/frontend/public
COPY --from=base /app/apps/frontend/next.config.js ./apps/frontend/
COPY --from=base /app/apps/frontend/package.json ./apps/frontend/

# Expose port
EXPOSE 3000

# Set working directory to frontend
WORKDIR /app/apps/frontend

# Start the application
CMD ["pnpm", "start"]