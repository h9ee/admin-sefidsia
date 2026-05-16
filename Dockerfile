# syntax=docker/dockerfile:1.6

# ---------- Stage 1: dependencies ----------
FROM node:20-alpine AS deps

WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

# ---------- Stage 2: build ----------
FROM node:20-alpine AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* must be present at build time so they get inlined.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=Asia/Tehran

RUN apk add --no-cache tini wget tzdata \
    && cp /usr/share/zoneinfo/Asia/Tehran /etc/localtime \
    && echo "Asia/Tehran" > /etc/timezone \
    && addgroup -S app && adduser -S app -G app

# Standalone output bundles only what's needed; public/ and .next/static must be
# copied alongside (Next does NOT copy them automatically into standalone/).
COPY --chown=app:app --from=builder /app/public         ./public
COPY --chown=app:app --from=builder /app/.next/standalone ./
COPY --chown=app:app --from=builder /app/.next/static   ./.next/static

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
