# syntax=docker/dockerfile:1
FROM node:20-slim AS base
RUN npm install -g pnpm@9.1.0

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/team-management/package.json ./packages/team-management/
COPY packages/onboarding-consent-engine/package.json ./packages/onboarding-consent-engine/
COPY apps/demo-host/package.json ./apps/demo-host/
# Install all workspace deps
RUN pnpm install --no-frozen-lockfile

# ── Build team-management ─────────────────────────────────────────────────────
FROM deps AS build-tm
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/team-management ./packages/team-management
RUN pnpm --filter @varshylinc/team-management build

# ── Build onboarding-consent-engine ──────────────────────────────────────────
FROM build-tm AS build-oce
WORKDIR /app
COPY packages/onboarding-consent-engine ./packages/onboarding-consent-engine
RUN pnpm --filter @varshylinc/onboarding-consent-engine build

# ── Build demo-host client + server ──────────────────────────────────────────
FROM build-oce AS build-app
WORKDIR /app
COPY apps/demo-host ./apps/demo-host
RUN pnpm --filter @varshylinc/demo-host build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-slim AS production
RUN npm install -g pnpm@9.1.0
WORKDIR /app
ENV NODE_ENV=production

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/team-management/package.json ./packages/team-management/
COPY packages/onboarding-consent-engine/package.json ./packages/onboarding-consent-engine/
COPY apps/demo-host/package.json ./apps/demo-host/

# Install production deps only
RUN pnpm install --no-frozen-lockfile --prod

# Copy built artifacts (including SQL migration files copied into dist by each build script)
COPY --from=build-app /app/packages/team-management/dist ./packages/team-management/dist
COPY --from=build-app /app/packages/onboarding-consent-engine/dist ./packages/onboarding-consent-engine/dist
COPY --from=build-app /app/apps/demo-host/dist ./apps/demo-host/dist

# Railway injects PORT=8080 for Node.js services via Nixpacks layer
EXPOSE 8080
WORKDIR /app/apps/demo-host
CMD ["node", "dist/server/index.js"]
