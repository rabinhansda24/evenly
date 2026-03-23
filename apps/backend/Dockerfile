# Backend Dockerfile - build context is monorepo root
FROM node:20-alpine AS base

WORKDIR /app

COPY apps/backend/package.json ./package.json

RUN npm install

COPY apps/backend/ ./

RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY apps/backend/package.json ./package.json
RUN npm install --omit=dev

COPY --from=base /app/dist ./dist
COPY --from=base /app/loader.js ./
COPY --from=base /app/drizzle.config.ts ./
COPY --from=base /app/src/db/migrations ./dist/db/migrations

EXPOSE 4000

CMD ["node", "dist/server.js"]
