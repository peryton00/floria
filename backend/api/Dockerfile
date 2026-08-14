# Production Dockerfile for Floria API Server (Render / Docker container deployment)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root pnpm files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/types ./packages/types
COPY backend/api ./backend/api

# Install pnpm and dependencies
RUN npm install -g pnpm@11.21.0
RUN pnpm install --frozen-lockfile

# Build packages and backend
RUN pnpm --filter @floria/types build || true
RUN pnpm --filter @floria/api build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/backend/api/dist ./dist
COPY --from=builder /app/backend/api/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "dist/server.js"]
