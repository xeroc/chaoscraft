ARG NODE_VERSION=24.13.0-slim

FROM node:${NODE_VERSION} AS dependencies
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY apps/portal/package.json ./apps/portal/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV DOCKER_BUILD=true

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/portal/node_modules ./apps/portal/node_modules
COPY apps/portal ./apps/portal

WORKDIR /app/apps/portal
RUN corepack enable pnpm && pnpm build

FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/portal/public ./apps/portal/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/portal/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/portal/.next/static ./apps/portal/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/portal/server.js"]
