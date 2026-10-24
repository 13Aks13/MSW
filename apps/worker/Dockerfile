FROM node:24-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY apps/worker ./apps/worker
COPY apps/core-api ./apps/core-api
COPY packages/shared ./packages/shared
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate && pnpm install --frozen-lockfile
RUN pnpm --filter @mc/shared build && pnpm --filter @mc/worker build

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/apps/worker/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV NODE_ENV=production
CMD ["node", "dist/apps/worker/src/main.js"]
