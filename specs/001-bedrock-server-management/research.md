# Research Findings: Minecraft Bedrock Management Platform

**Feature**: 001-bedrock-server-management  
**Date**: 2026-10-23  
**Purpose**: Resolve all `NEEDS CLARIFICATION` items from Technical Context before Phase 1 design.

---

## Decision 1: Testing Framework

**Decision**: Use **Jest** as the unified test runner across the pnpm monorepo (`apps/core-api`, `apps/web-app`, `packages/shared`), run via `pnpm test`.

**Rationale**:
- NestJS (backend) ships with Jest as its default test framework, so backend testing is idiomatic with zero added configuration.
- Jest supports TypeScript natively via `ts-jest`/`sucrase` and can test React components (frontend) alongside backend, keeping one runner for the whole workspace.
- The constitution requires `pnpm test` to pass for all packages before any change is complete; a single runner simplifies the quality gate and CI.
- Biome is already configured for lint/format, so it complements (not replaces) Jest for testing.

**Alternatives considered**:
- **Vitest**: Vite-native, fast, popular for React frontend. Rejected because it adds a second runner alongside NestJS's default Jest, splitting the monorepo's test tooling and complicating the `pnpm test` gate.
- **Mocha + Chai**: Mature but requires more setup and is not the NestJS default; rejected for higher configuration overhead.

---

## Decision 2: Scale / Scope

**Decision**: **Single-server deployment** for v1, targeting a small administrator team.

**Assumed scale (v1)**:
- Concurrent administrators: ~1–5
- Worlds per server: tens (not hundreds)
- Pack volume: dozens of Resource/Behavior Packs
- Archive size: up to 500 MB per ZIP bundle (as specified)

**Rationale**:
- `docs/plan-00.md` lists "multi-server management" as a **Future Feature (V2)**, confirming v1 is single-server.
- Performance goals already bound the scope: API < 300 ms, ZIP import < 30 s for 500 MB, logs within 5 s — all achievable on a single Docker Compose host.
- Constitution Principle I (Modular Package-First) keeps packages independently deployable, so multi-server can be added later without rearchitecting v1.

**Alternatives considered**:
- **Multi-server from v1**: Rejected — out of scope per `plan-00.md` (V2), adds orchestration complexity (service discovery, shared storage, distributed locks) not justified for the initial administrator audience.

---

## Summary

| Unknown           | Decision                            | Source                                         |
| ----------------- | ----------------------------------- | ---------------------------------------------- |
| Testing framework | Jest (unified, monorepo-wide)       | NestJS default + constitution `pnpm test` gate |
| Scale / scope     | Single-server, v1; small admin team | `plan-00.md` V2 roadmap + performance goals    |

Both `NEEDS CLARIFICATION` items are resolved. No remaining unknowns block Phase 1 design.
