# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/core-api/package.json apps/core-api/
COPY apps/worker/package.json apps/worker/
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/core-api apps/core-api
COPY apps/worker apps/worker
# The worker reuses core-api modules, so its dependency tree must be materialized
# explicitly. `pnpm deploy` produces a self-contained production bundle instead of
# relying on the workspace node_modules layout.
RUN pnpm --filter @mc/shared build \
 && pnpm --filter @mc/worker build \
 && pnpm --filter @mc/worker deploy --prod /out \
 && cp -r apps/worker/dist /out/dist \
 && rm -rf /out/src /out/tsconfig*.json /out/*.tsbuildinfo /out/Dockerfile

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
CMD ["node", "dist/apps/worker/src/main.js"]
