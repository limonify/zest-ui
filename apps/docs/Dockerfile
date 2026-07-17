# syntax=docker/dockerfile:1
# Build context: repo root. Dockerfile path: apps/docs/Dockerfile

FROM oven/bun:1.3.9-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/docs/package.json apps/docs/package.json
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.9-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/docs/node_modules ./apps/docs/node_modules
COPY package.json bun.lock ./
COPY apps/docs ./apps/docs
RUN bun run --cwd apps/docs build

FROM nginx:alpine AS runner
COPY apps/docs/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/docs/out /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
