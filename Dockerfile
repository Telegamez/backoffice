# Next.js 15 production image with standalone output

FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@latest --activate

# 1) Install dependencies (cached)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
# Prefer pnpm if lockfile exists; fallback to npm
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    else npm ci; fi

# 2) Build
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN if [ -f pnpm-lock.yaml ]; then pnpm run build; else npm run build; fi

# 3) Runtime image
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Install postgresql-client for migrations and ffmpeg for IPTV validation
RUN apk add --no-cache postgresql-client netcat-openbsd ffmpeg

# Non-root user
RUN addgroup -g 1001 -S nextjs && adduser -S nextjs -u 1001

# Copy standalone server
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Copy migration files and drizzle config
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Copy entrypoint script
COPY --chown=nextjs:nextjs scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create IPTV output directory with proper permissions
RUN mkdir -p /app/public/iptv-output && chown -R nextjs:nextjs /app/public/iptv-output

USER nextjs

# The app listens on 3100 (see package.json); PORT is respected by Next standalone
ENV PORT=3100
EXPOSE 3100

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]


