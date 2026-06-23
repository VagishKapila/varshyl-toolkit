# syntax=docker/dockerfile:1
# Monorepo build — Docker context must be repo root (see apps/demo-host/railway.json).
FROM node:20-slim
RUN npm install -g pnpm@9.1.0
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/demo-host ./apps/demo-host
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @varshylinc/demo-host... build
WORKDIR /app/apps/demo-host
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
