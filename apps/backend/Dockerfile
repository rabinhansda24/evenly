# Backend Dockerfile (for build context: /apps/backend)
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies (no lockfile available in this context)
COPY package.json ./

# Install dependencies without frozen lockfile (since lockfile isn't in this context)
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package.json for production dependencies
COPY package.json ./

# Install only production dependencies without frozen lockfile
RUN pnpm install --no-frozen-lockfile --prod

# Copy built application and necessary runtime files
COPY --from=base /app/dist ./dist
COPY --from=base /app/loader.js ./
COPY --from=base /app/drizzle.config.ts ./
COPY --from=base /app/src/db/migrations ./src/db/migrations

# Expose port
EXPOSE 4000

# Start the application
CMD ["node", "dist/server.js"]