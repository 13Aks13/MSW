# Implementation Plan: Async Pack Import with Worker and Real-Time Progress

**Branch**: `002-async-pack-import`
**Date**: 2026-10-24
**Spec**: `./spec.md`

## Summary

Route pack bundles larger than 20 MB to a BullMQ-backed worker process while preserving the synchronous import path for smaller bundles. Add a WebSocket channel for real-time progress, step, and log events, plus a polling fallback API for job status and final reports.

## Technical Context

- **Backend**: NestJS, TypeScript, TypeORM, PostgreSQL, BullMQ, Redis, Socket.IO
- **Frontend**: React, TypeScript, Vite, Ant Design, TanStack Query, Socket.IO client
- **Shared**: `packages/shared` typed API contracts
- **Storage**: temporary uploaded files and extracted directories under the existing storage root
- **Testing**: Jest/Vitest contract tests, lint, typecheck, build

## Constitution Check

- Modular package-first: changes stay in `apps/core-api`, `apps/web-app`, and `packages/shared`.
- Type-safe TypeScript everywhere: new queues, events, and DTOs must be typed in shared.
- Observability: worker emits structured logs and WebSocket events.
- TDD: queue adapter, job service, WebSocket gateway, and UI progress hook require tests.

## Phase 0: Research

- Decision: use BullMQ with Redis for queueing and progress.
- Decision: use the existing Socket.IO gateway for progress events.
- Decision: keep synchronous import for <= 20 MB to avoid unnecessary queue overhead.
- Decision: persist job metadata in PostgreSQL for refresh recovery.
- Alternative considered: in-process background tasks; rejected because they do not survive API restarts and scale poorly.

## Phase 1: Design

### Data Model

- `ImportJob` entity with id, type, policy, filePath, status, progress, currentStep, logs, report, error, createdAt, updatedAt, completedAt.
- `ImportJobStatus`: queued, active, completed, failed, cancelled.

### Contracts

- `POST /packs/import` keeps current synchronous behavior for <= 20 MB.
- `POST /packs/import/async` accepts a large bundle and returns `{ jobId, status }`.
- `GET /packs/import/jobs/:id` returns job status, progress, step, logs, report, and error.
- WebSocket event `import:progress` payload: `{ jobId, progress, step, log?, status, report?, error? }`.

### Quickstart

1. Start Redis and the API with worker enabled.
2. Upload a bundle larger than 20 MB.
3. Observe queued job and live progress.
4. Verify final report and pack list update.

## Phase 2: Implementation Outline

1. Add Redis/BullMQ configuration and queue module.
2. Add `ImportJob` entity and repository.
3. Refactor PackImportService to emit progress callbacks and support worker execution.
4. Add async controller endpoints and job status endpoint.
5. Add worker processor and cleanup handling.
6. Add Socket.IO gateway events and room subscription by job id.
7. Update shared types and web API client.
8. Update PacksPage to choose sync/async path and render live progress/logs.
9. Add tests and documentation.
