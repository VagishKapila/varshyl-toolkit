# syntax=docker/dockerfile:1
FROM node:20-slim AS base
RUN npm install -g pnpm@9.1.0

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/team-management/package.json ./packages/team-management/
COPY apps/demo-host/package.json ./apps/demo-host/
# Install all workspace deps
RUN pnpm install --frozen-lockfile

# ── Build team-management ─────────────────────────────────────────────────────
FROM deps AS build-tm
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/team-management ./packages/team-management
RUN pnpm --filter @varshyl/team-management build

# ── Build demo-host client + server ──────────────────────────────────────────
FROM build-tm AS build-app
WORKDIR /app
COPY apps/demo-host ./apps/demo-host
RUN pnpm --filter @varshyl/demo-host build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-slim AS production
RUN npm install -g pnpm@9.1.0
WORKDIR /app
ENV NODE_ENV=production

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/team-management/package.json ./packages/team-management/
COPY apps/demo-host/package.json ./apps/demo-host/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=build-app /app/packages/team-management/dist ./packages/team-management/dist
COPY --from=build-app /app/packages/team-management/src/server/migrations ./packages/team-management/src/server/migrations
COPY --from=build-app /app/apps/demo-host/dist ./apps/demo-host/dist

EXPOSE 3000
WORKDIR /app/apps/demo-host
CMD ["node", "dist/server/index.js"]
