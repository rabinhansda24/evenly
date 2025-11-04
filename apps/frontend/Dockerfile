# Frontend Dockerfile (Next.js 16) - for build context: /apps/frontend
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package.json (lockfile not available in this context)
COPY package.json ./

# Install dependencies without frozen lockfile
RUN pnpm install --no-frozen-lockfile

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
# Copy node_modules from deps stage and package file
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Copy source code
COPY . .

# Build frontend
RUN pnpm build

# Production runtime (standalone)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the standalone build output
# Requires next.config.ts with `output: 'standalone'`
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
