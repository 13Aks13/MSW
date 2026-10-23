# Implementation Plan: Minecraft Bedrock Management Platform

**Branch**: `001-bedrock-server-management` | **Date**: 2026-10-23 | **Spec**: `specs/001-bedrock-server-management/spec.md`

**Input**: Feature specification from `specs/001-bedrock-server-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Web-based administration platform for Minecraft Bedrock Server running in Docker. Administrators manage server lifecycle (start/stop/restart), upload ZIP bundles of Resource Packs and Behavior Packs, create/clone/backup/restore worlds, view real-time logs, and edit server configuration — all through a web interface without manual JSON file editing or SSH/Docker CLI.

## Technical Context

**Language/Version**: TypeScript, Node.js >= 24.11.0, pnpm >= 10

**Primary Dependencies**: NestJS, TypeORM, PostgreSQL 16+, React, Vite, Ant Design, Zustand, TanStack Query, Socket.IO, Dockerode, Docker Compose, Traefik, Biome, Commitlint, semantic-release

**Storage**: PostgreSQL 16+ (relational data), host-mounted volume (worlds, packs, backups, temp, metadata)

**Testing**: [NEEDS CLARIFICATION: testing framework not specified — `pnpm test` runs all workspace packages but the specific runner (e.g., Jest, Vitest) is not defined]

**Target Platform**: Linux server (Ubuntu 22+, Debian 12+), Docker Compose container environment

**Project Type**: web-service (NestJS backend API + React frontend SPA, pnpm monorepo)

**Performance Goals**: API response < 300 ms for normal operations; ZIP import < 30 seconds for a 500 MB archive; real-time log updates within 5 seconds; server start/stop/restart under 1 minute

**Constraints**: Maximum upload size 500 MB per archive; JWT authentication with bcrypt and 12-hour session; administrators require Docker host access; mobile support out of scope for v1

**Scale/Scope**: [NEEDS CLARIFICATION: expected concurrent users, world count, and pack volume not specified — single-server deployment assumed for v1]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Constitution v1.0.0 (ratified 2026-10-23) — compliance evaluation:
- **I. Modular Package-First Architecture**: PASS. Feature is built as self-contained workspace packages under `apps/*` (`core-api`, `web-app`) and `packages/*` (`shared`). Each package independently testable, documented with README. No organizational-only packages.
- **II. Test-First Development (TDD)**: PASS. `pnpm test` MUST pass for all workspace packages; Red-Green-Refactor cycle enforced before any change is complete.
- **III. Type-Safe TypeScript Everywhere**: PASS. Strict type checking via `pnpm typecheck`; shared types in `packages/shared` consumed by `core-api` and `web-app`; `any` prohibited without documented justification.
- **IV. Conventional Commits and Automated Releases**: PASS. Commits follow `type(scope): description`, enforced by Commitlint and lint-staged; releases automated via semantic-release on push to `main`.
- **V. Observability and Operational Transparency**: PASS. Real-time server logs via Socket.IO; structured logging in NestJS backend; Docker Compose mirrors production locally.

**Gate result**: All 5 principles PASS. No violations. Plan may proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
  core-api/           # NestJS backend API (TypeORM, PostgreSQL, Socket.IO, Dockerode)
    src/
      modules/        # feature modules: servers, packs, worlds, backups, logs, config, auth
    test/
  web-app/            # React frontend (Vite, Ant Design, Zustand, TanStack Query, Socket.IO client)
    src/
      components/
      pages/
      api/            # API client (packs, settings, worlds, backups, server, auth)
    test/
packages/
  shared/             # Shared types, constants, API helpers
    src/
storage/              # Local file storage (worlds, packs, backups)
data/                 # Bedrock server runtime data
docs/
  plan-00.md          # Product specification v1.0
.infra/               # Docker Compose, Traefik configuration
```

**Structure Decision**: Web application structure (frontend + backend detected). Backend lives in `apps/core-api`, frontend in `apps/web-app`, shared types in `packages/shared`, per the existing pnpm monorepo layout and Constitution Principle I (Modular Package-First). Feature modules are added under `apps/core-api/src/modules/` and `apps/web-app/src/` without introducing new top-level project directories.

## Complexity Tracking

Not applicable — Constitution Check passed with zero violations; no violations to justify.
