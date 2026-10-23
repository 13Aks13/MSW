<!-- Sync Impact Report
Version change: unversioned scaffold → 1.0.0
Modified principles: none (initial constitution adoption)
Added sections: Core Principles (I–V), Engineering Standards, Development Workflow and Quality Gates, Governance
Removed sections: none
Follow-up TODOs: none
-->

# Minecraft Bedrock Management Platform Constitution

## Core Principles

### I. Modular Package-First Architecture

Every feature is built as a self-contained workspace package under `apps/*` or `packages/*`. Each package MUST be independently testable, independently deployable where applicable, and documented with a README. Organizational-only packages with no clear purpose are prohibited. Current structure: `apps/core-api` (NestJS backend), `apps/web-app` (React frontend), `packages/shared` (shared types and API helpers).

Rationale: The monorepo uses pnpm workspaces; modular boundaries prevent coupling between the backend, frontend, and shared layers, and make each part of the system independently verifiable.

### II. Test-First Development (TDD)

Tests are written before implementation for all new behavior. The Red-Green-Refactor cycle is strictly enforced: a failing test MUST exist and be approved, then the implementation makes it pass. `pnpm test` MUST pass for all workspace packages before any change is considered complete.

Rationale: Test-first guarantees that every feature has verifiable behavior and prevents regressions across the NestJS API, React frontend, and shared packages.

### III. Type-Safe TypeScript Everywhere

All code is written in TypeScript with strict type checking enabled. `pnpm typecheck` MUST pass for all packages. Shared types live in `packages/shared` and are consumed by `apps/core-api` and `apps/web-app`. The use of `any` is prohibited without a documented justification in the code.

Rationale: A type-safe codebase across backend, frontend, and shared layers catches interface mismatches at compile time, which is critical for a platform whose frontend and backend communicate over typed API contracts.

### IV. Conventional Commits and Automated Releases

All commits follow the Conventional Commits format (`type(scope): description`) and are enforced by Commitlint. Releases are automated via semantic-release on push to `main`, which bumps versions, generates changelogs, and creates GitHub releases.

Rationale: Conventional Commits power automated semantic versioning and release notes, keeping the platform's release process predictable and auditable.

### V. Observability and Operational Transparency

Server logs are streamed in real time to administrators via Socket.IO. Structured logging is required in the NestJS backend. Local development uses Docker Compose to mirror production services (Traefik, PostgreSQL, core-api, web-app, Bedrock server).

Rationale: Operators of a Minecraft Bedrock server need immediate visibility into server state and logs; observable, locally reproducible environments reduce operational incidents.

## Engineering Standards

The platform is a pnpm monorepo with the following technology stack:

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

Required runtimes: Node.js >= 24.11, pnpm >= 10. Docker and Docker Compose are required for containerized development.

## Development Workflow and Quality Gates

- `pnpm dev` — start core-api and web-app in parallel
- `pnpm build` — build all workspace packages
- `pnpm typecheck` — type-check all packages
- `pnpm lint` — run Biome linter on all packages
- `pnpm format` — auto-fix formatting with Biome
- `pnpm test` — run tests for all packages
- `pnpm compose:up` / `pnpm compose:down` — start or stop all Docker services

All pull requests MUST be reviewed and MUST pass typecheck, lint, and tests before merge. Commit messages follow Conventional Commits and are validated by Commitlint and lint-staged on commit.

## Governance

This Constitution supersedes all other development practices in the repository. Where a practice conflicts with a Principle, the Principle governs.

Amendments to this Constitution MUST be documented in this file, approved through a pull request, and include a migration plan for any affected practices. The version is bumped according to semantic versioning: MAJOR for backward-incompatible governance or principle changes, MINOR for new or materially expanded principles or sections, PATCH for clarifications and wording fixes.

Compliance is reviewed during every pull request: reviewers verify that the change aligns with the Core Principles, Engineering Standards, and Development Workflow. Non-compliant changes MUST be justified explicitly or amended before merge.

**Version**: 1.0.0 | **Ratified**: 2026-10-23 | **Last Amended**: 2026-10-23
