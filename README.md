# Minecraft Bedrock Management Platform

A web-based administration platform for Minecraft Bedrock Server running in Docker.

## Overview

This platform provides centralized management of:
- Minecraft Bedrock Server lifecycle (start/stop/restart)
- Resource Packs and Behavior Packs
- Worlds (create, delete, clone, backup, restore)
- Backups
- Server logs (real-time console)
- Server configuration (`server.properties`)

Administrators can upload ZIP bundles containing multiple Resource Packs and Behavior Packs, then use them when creating worlds — without manually editing Minecraft JSON configuration files.

## Tech Stack

| Layer              | Technology                               |
| ------------------ | ---------------------------------------- |
| Monorepo           | pnpm workspaces (`apps/*`, `packages/*`) |
| Backend            | NestJS, TypeScript, TypeORM, PostgreSQL  |
| Frontend           | React, TypeScript, Vite, Ant Design      |
| State              | Zustand, TanStack Query                  |
| Real-time          | Socket.IO                                |
| Docker integration | Dockerode, Docker Compose, Traefik       |
| Formatting / Lint  | Biome                                    |
| Commits            | Conventional Commits + Commitlint        |
| Releases           | semantic-release (GitHub Actions)        |

## Repository Structure

```
apps/
  core-api/   # NestJS backend API
  web-app/    # React frontend
packages/
  shared/     # Shared types, constants, API helpers
docs/
  plan-00.md  # Product specification v1.0
storage/      # Local file storage (worlds, packs, backups)
data/         # Bedrock server runtime data
```

## Getting Started

### Prerequisites

- Node.js >= 24.11
- pnpm >= 10
- Docker & Docker Compose (for containerized deployment)

### Install dependencies

```bash
pnpm install
```

### Environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Required variables (examples):

```
DB_NAME=mc_platform
DB_USER=mc
DB_PASSWORD=changeme
APP_HOST=app.localhost
TRAEFIK_HTTP_PORT=80
TRAEFIK_HTTPS_PORT=443
TRAEFIK_DASHBOARD_PORT=8090
```

### Development (local)

Run both API and frontend in parallel:

```bash
pnpm dev
```

Or individually:

```bash
pnpm dev:api   # NestJS backend (http://localhost:3000)
pnpm dev:web   # React frontend (http://localhost:5173)
```

### Docker Compose

Start all services (Traefik, PostgreSQL, core-api, web-app, Bedrock server):

```bash
pnpm compose:up
```

View logs:

```bash
pnpm compose:logs
```

Stop:

```bash
pnpm compose:down
```

## Available Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `pnpm dev`          | Start core-api + web-app in dev mode |
| `pnpm build`        | Build all workspace packages         |
| `pnpm typecheck`    | Type-check all packages              |
| `pnpm lint`         | Run Biome linter on all packages     |
| `pnpm format`       | Auto-fix formatting with Biome       |
| `pnpm test`         | Run tests for all packages           |
| `pnpm release`      | Trigger semantic-release             |
| `pnpm compose:up`   | Start all Docker services            |
| `pnpm compose:down` | Stop all Docker services             |

## Releases

This project uses [semantic-release](https://semantic-release.gitbook.io/) with [Conventional Commits](https://www.conventionalcommits.org/).

Commit message format:

```
type(scope): description

Examples:
feat(api): add world backup endpoint
fix(web): resolve pack upload validation
chore(deps): update biome to v2.6.2
```

Push to `main` triggers the GitHub Actions release workflow, which automatically bumps the version, generates a changelog, and creates a GitHub release.

## License

UNLICENSED
