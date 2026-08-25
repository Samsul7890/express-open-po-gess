# ==========================================
# Stage 1: Base with dependencies
# ==========================================
FROM oven/bun:1 AS base

WORKDIR /app

COPY package*.json bun.lock* ./
RUN bun install

COPY . .
RUN bun run prisma generate

# ==========================================
# Stage 2: Development (bun --watch hot-reload)
# ==========================================
FROM base AS development

ENV NODE_ENV=development

EXPOSE 3000

CMD ["bun", "--watch", "src/server.ts"]


# ==========================================
# Stage 3: Builder (compile TypeScript)
# ==========================================
FROM base AS builder

RUN bun run build


# ==========================================
# Stage 4: Production (minimal image)
# ==========================================
FROM oven/bun:1 AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json bun.lock* ./
RUN bun install --production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["bun", "dist/server.js"]
