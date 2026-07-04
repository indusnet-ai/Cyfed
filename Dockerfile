# Multi-stage build for FedSOC Dashboard
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/dashboard/package*.json ./apps/dashboard/
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY . .

# Environment variables validated with Zod
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run --prefix apps/dashboard build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next ./apps/dashboard/.next
COPY --from=builder /app/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY --from=builder /app/apps/dashboard/package.json ./apps/dashboard/package.json
COPY --from=builder /app/apps/dashboard/next.config.ts ./apps/dashboard/next.config.ts

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "--prefix", "apps/dashboard", "start"]
