FROM node:24-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy root configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/dashboard/package.json ./apps/dashboard/

# Install dependencies (onlyBuiltDependencies already allows esbuild/sharp/unrs-resolver)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/schemas ./packages/schemas
COPY apps/dashboard ./apps/dashboard

# Build dashboard
RUN pnpm --filter dashboard build

EXPOSE 3000

CMD ["pnpm", "--filter", "dashboard", "start"]
