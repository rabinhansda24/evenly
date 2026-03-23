# Frontend Dockerfile (Next.js) - build context is monorepo root
FROM node:20-alpine AS deps

WORKDIR /app

COPY apps/frontend/package.json ./package.json

RUN npm install

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

COPY apps/frontend/ ./

# NEXT_PUBLIC_* vars must be available at build time (baked into JS bundles)
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Production runtime (standalone)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
