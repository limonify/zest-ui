# syntax=docker/dockerfile:1
# Build context: repo root. Dockerfile path: apps/docs/Dockerfile

FROM oven/bun:1.3.9-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/docs/package.json apps/docs/package.json
COPY apps/example/package.json apps/example/package.json
COPY packages/zest-ui/package.json packages/zest-ui/package.json
RUN bun install --frozen-lockfile --ignore-scripts

FROM oven/bun:1.3.9-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/docs/node_modules ./apps/docs/node_modules
COPY package.json bun.lock ./
COPY packages/zest-ui ./packages/zest-ui
COPY apps/docs ./apps/docs
WORKDIR /app/apps/docs
RUN bunx fumadocs-mdx && bun run build

FROM nginx:alpine AS runner
COPY apps/docs/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/docs/out /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
