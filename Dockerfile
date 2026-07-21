# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# 1) deps  — install once, cached on package*.json changes only
# 2) builder — copy source, run `next build` (emits .next/standalone)
# 3) runner  — tiny final image with ONLY the standalone bundle + static + public
#
# Why this layout: `next.config.ts` already opts into `output: 'standalone'`,
# which writes a self-contained `.next/standalone/server.js` plus the minimum
# node_modules it actually requires at runtime. Copying that (~50 MB) into the
# runner is fast; copying the full build-time node_modules (~1.5 GB / 150k
# files) used to take >3 minutes in the COPY step alone.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:24-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm config set registry https://npm.iranserver.com/repository/npm/ \
 && npm ci --legacy-peer-deps


FROM node:24-alpine AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_URL_IMAGE
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL_IMAGE=$NEXT_PUBLIC_API_URL_IMAGE
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build


FROM node:24-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Standalone server respects PORT; pinning it here makes the container's
# listening port deterministic regardless of host env.
ENV PORT=3000

# Drop root for the running process — Next's standalone server doesn't need
# any elevated capability and reducing surface area is cheap insurance.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# `.next/standalone` contains server.js + a minimal node_modules; `static/`
# and `public/` are NOT included by the standalone copy, so we add them
# explicitly below.
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
