# Tasks: Minecraft Bedrock Management Platform

**Input**: Design documents from `specs/001-bedrock-server-management/` (plan.md, spec.md, data-model.md, contracts/api.md, research.md, quickstart.md)

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED — the Constitution (Principle II, Test-First Development) mandates TDD for all new behavior: tests written first, must FAIL before implementation, then implement, then re-run.

**Organization**: Tasks are grouped by user story (US1–US6) so each story can be implemented, tested, and deployed independently.

## Format: `[ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

## Path Conventions (per plan.md)

- **Backend**: `apps/core-api/src/` → `modules/` (feature modules: servers, packs, worlds, backups, logs, config, auth)
- **Frontend**: `apps/web-app/src/` → `components/`, `pages/`, `api/`
- **Shared types**: `packages/shared/src/`
- **Database**: PostgreSQL 16+, TypeORM, host-mounted volumes under `storage/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the NestJS + React pnpm monorepo.
- [x] T001 Create pnpm workspace configuration for `apps/core-api` (NestJS) and `apps/web-app` (React/Vite), plus `packages/shared`
- [x] T002 Install dependencies for all workspaces (NestJS, TypeORM, PostgreSQL driver, React, Vite, Ant Design, Zustand, TanStack Query, Socket.IO, Dockerode, Biome, Jest, ts-jest, supertest, Socket.IO)
- [x] T003 [P] Configure Biome for linting and formatting across all workspaces
- [x] T004 Configure `tsconfig.base.json` with strict mode for all workspaces

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.
- [x] T005 [P] Implement authentication/authorization (JWT sign/verify, bcrypt password hashing, auth guard, roles) in `packages/shared/src/auth/` so all workspaces can consume it
- [x] T006 [P] Setup PostgreSQL database connection and TypeORM configuration in `apps/core-api`
- [x] T007 [P] Setup API routing and middleware: global prefix `/api`, JWT authentication guard, CORS, body parsing, error handling, validation pipes
- [x] T008 Create base entities in `packages/shared/src/entities/` (User, Server, World, ResourcePack, BehaviorPack, Backup, Configuration, LogEntry) with fields and validation rules per data-model.md
- [x] T009 Setup environment configuration management (dotenv, config service) in `apps/core-api`
- [x] T010 Configure Socket.IO in `apps/core-api` for real-time log streaming to the frontend
- [x] T011 Setup the project directory structure per plan.md: `apps/core-api/src/modules/`, `apps/web-app/src/{components,pages,api}`, `packages/shared/src/`, `storage/`



## Phase 3: User Story 1 — Server lifecycle management (start/stop/restart) (Priority: P1) 🎯 MVP

**Goal**: Administrator can start, stop, and restart the Minecraft Bedrock Server from the web UI via REST API.

**Independent Test**: Use `pnpm compose:up` (quickstart.md Scenario 1); call `POST /api/servers/{start,stop,restart}` and verify `GET /api/servers/status` transitions correctly; verify Socket.IO `server:status` event emitted.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**
- [x] T012 [P] [US1] Contract test for `GET /status` and life-cycle endpoints in `apps/core-api/test/contract/test-server-lifecycle.spec.ts`
- [x] T013 [P] [US1] Integration test for server start/stop/restart flow in `apps/core-api/test/integration/test-server-lifecycle-flow.spec.ts`

### Implementation for User Story 1

- [x] T014 [P] [US1] Create Server entity model in `apps/core-api/src/modules/servers/entities/server.entity.ts` (status, uptime, memoryUsage, cpuUsage, configuration relationship per data-model.md)
- [x] T015 [US1] Create ServerService in `apps/core-api/src/modules/servers/services/server.service.ts` (start/stop/restart logic via Dockerode, status transition validation per data-model.md)
- [x] T016 [US1] Implement ServerController in `apps/core-api/src/modules/servers/server.controller.ts` (GET /status, POST /start, POST /stop, POST /restart)
- [x] T017 [US1] Implement Socket.IO `server:status` event emission on status change (per contracts/api.md)


## Phase 4: User Story 2 — Resource Pack and Behavior Pack upload and management (Priority: P1)

**Goal**: Administrator can upload ZIP bundles, view packs, and delete them — packs are automatically detected and registered without manual JSON editing.

**Independent Test**: Use quickstart.md Scenario 2; upload a valid ZIP of packs and verify they appear in the list; delete a pack; upload a corrupted ZIP and verify a user-friendly error.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**
- [x] T018 [P] [US2] Contract test for `POST /upload` and `GET /` in `apps/core-api/test/contract/test-packs.spec.ts`
- [x] T019 [P] [US2] Integration test for pack upload detection and deletion flow in `apps/core-api/test/integration/test-packs-flow.spec.ts`

### Implementation for User Story 2

- [x] T020 [P] [US2] Create Pack entity (ResourcePack, BehaviorPack) in `packages/shared/src/entities/pack.entity.ts` with name, version, registrationStatus per data-model.md
- [x] T021 [US2] Create PackService in `apps/core-api/src/modules/packs/services/pack.service.ts` (ZIP validation: extension, file size ≤ 500 MB, MIME type; pack detection, DB registration, deletion)
- [x] T022 [US2] Implement PackController in `apps/core-api/src/modules/packs/packs.controller.ts` (POST /upload, GET /, DELETE /:id)


## Phase 5: User Story 3 — World creation and management using imported packs (Priority: P1)

**Goal**: Administrator can create, delete, clone, and restore worlds, selecting from imported Resource Packs and Behavior Packs; configuration files are generated automatically.

**Independent Test**: Use quickstart.md Scenario 3; create a world with selected packs and verify world files are generated; clone, delete, and verify the clone is independently manageable.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**
- [x] T024 [P] [US3] Contract test for `POST /`, `GET /`, `DELETE /:id`, and `POST /:id/clone` in `apps/core-api/test/contract/test-worlds.spec.ts`
- [x] T025 [P] [US3] Integration test for world creation with packs (auto-generated config files) in `apps/core-api/test/integration/test-world-creation.spec.ts`

### Implementation for User Story 3

- [x] T026 [P] [US3] Create World entity model in `packages/shared/src/entities/world.entity.ts` (name, resourcePackIds, behaviorPackIds, backupHistory, storageLocation per data-model.md)
- [x] T027 [US3] Create WorldService in `apps/core-api/src/modules/worlds/services/world.service.ts` (world CRUD, pack association, automatic configuration file generation)
- [x] T028 [US3] Implement WorldController in `apps/core-api/src/modules/worlds/worlds.controller.ts` (POST /, GET /, DELETE /:id, POST /:id/clone)


## Phase 6: User Story 4 — Backup and restore (Priority: P2)

**Goal**: Administrator can create backups of worlds and restore worlds from backups.

**Independent Test**: Use quickstart.md Scenario 4; create a backup, modify the world, restore, and verify the world matches the backed-up state.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**
- [x] T029 [P] [US4] Contract test for backup/restore endpoints in `apps/core-api/test/contract/test-backups.spec.ts`
- [x] T030 [P] [US4] Integration test for backup and restore without data loss in `apps/core-api/test/integration/test-backup-restore.spec.ts`

### Implementation for User Story 4

- [x] T031 [P] [US4] Create Backup entity model in `packages/shared/src/entities/backup.entity.ts` (name, createdAt, sourceWorld, archiveLocation, size)
- [x] T032 [US4] Create BackupService in `apps/core-api/src/modules/backups/services/backup.service.ts` (archive creation with world files, restore, cleanup old backups)


## Phase 7: User Story 5 — Real-time server logs viewing (Priority: P2)

**Goal**: Administrator can view real-time server logs and console output through the web interface.

**Independent Test**: Use quickstart.md Scenario 5; open Logs page while server is running and verify live console output updates within 5 seconds.

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**
- [x] T034 [P] [US5] Contract test for Socket.IO `log:line` event in `apps/core-api/test/contract/test-logs-socket.spec.ts`
- [x] T035 [P] [US5] Unit test for LogService consuming server process output in `apps/core-api/test/unit/test-log.service.ts`

### Implementation for User Story 5

- [x] T036 [P] [US5] Create LogEntry entity model in `packages/shared/src/entities/log-entry.entity.ts` (timestamp, level, message) and LogService
- [x] T037 [US5] Implement Socket.IO `/logs` namespace and `log:line` event emission from server process output in `apps/core-api/src/modules/logs/logs.gateway.ts`
- [x] T038 [US5] Implement frontend Logs page that subscribes to Socket.IO log stream (apps/web-app/src/pages/LogsPage.tsx)


## Phase 8: User Story 6 — Server configuration management (Priority: P2)

**Goal**: Administrator can view and edit `server.properties` and other server configuration through the web interface without manual file editing.

**Independent Test**: Use quickstart.md Scenario 6; change a `server.properties` value in the UI, save, and verify the file is updated and the server applies it.

### Tests for User Story 6

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**
- [x] T039 [P] [US6] Contract test for `GET /config` and `PUT /config` in `apps/core-api/test/contract/test-config.spec.ts`

### Implementation for User Story 6

- [x] T040 [P] [US6] Create ConfigurationService in `apps/core-api/src/modules/config/services/config.service.ts` (read/write `server.properties` key/value map)
- [x] T041 [US6] Implement ConfigController in `apps/core-api/src/modules/config/config.controller.ts` (GET /config, PUT /config)

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Frontend pages, cross-cutting quality, and end-to-end validation.
- [x] T043 [P] [US1] Frontend Dashboard page in `apps/web-app/src/pages/DashboardPage.tsx` (server online status, uptime, memory, CPU, world count, pack count)
- [x] T044 [P] [US2] Frontend Resource Packs and Behavior Packs pages in `apps/web-app/src/pages/PacksPage.tsx` (upload bundle, list, search, delete)
- [x] T045 [P] [US3] Frontend Worlds page in `apps/web-app/src/pages/WorldsPage.tsx` (create, delete, clone, backup, restore; pack selection)
- [x] T046 [P] [US5] Frontend Logs page in `apps/web-app/src/pages/LogsPage.tsx` (real-time Socket.IO streaming, log levels)
- [x] T047 [P] [US6] Frontend Settings page in `apps/web-app/src/pages/SettingsPage.tsx` (configuration editing)
- [x] T048 [P] Frontend API client in `apps/web-app/src/api/` for all management endpoints per contracts/api.md
- [x] T049 [P] Frontend state management (Zustand stores) and data caching (TanStack Query) for dashboard, packs, worlds, logs, settings
- [x] T050 [P] Run `pnpm lint` across all workspaces and fix all lint errors
- [x] T051 [P] Run `pnpm typecheck` across all workspaces and resolve all type errors
- [x] T052 [P] Run `pnpm test` across all workspaces (all tests must pass, per Constitution Principle II)
- [x] T053 Run quickstart.md validation scenarios end-to-end and verify all success criteria
- [x] T054 Commit implementation changes with Conventional Commits (type(scope): description; scope in {api, web, shared, deps, release, infra, docker, config, speckit})

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed) or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **US2 (P1)**: Can start after Foundational (Phase 2) — independently testable
- **US3 (P1)**: Can start after Foundational (Phase 2) — independently testable
- **US4 (P2)**: Can start after Foundational (Phase 2) — independently testable
- **US5 (P2)**: Can start after Foundational (Phase 2) — independently testable
- **US6 (P2)**: Can start after Foundational (Phase 2) — independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services; services before controllers
- Core implementation before integration; story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- Once Foundational completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Stories 1–3 only — P1 priority)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3 (US1), Phase 4 (US2), Phase 5 (US3)
4. **STOP and VALIDATE**: Test US1–US3 independently (quickstart.md Scenarios 1–3); deploy/demo if ready

### Incremental Delivery (full scope)

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo
3. Add US2 → Test independently → Deploy/Demo
4. Add US3 → Test independently → Deploy/Demo
5. Add US4 → US5 → US6 → Test each independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (server lifecycle)
   - Developer B: US2 (packs)
   - Developer C: US3 (worlds)
   - Developer D: US4–US6 (backup, logs, config)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Red-Green-Refactor, per Constitution Principle II)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
- Scope/performance defaults from research.md: Jest for testing; single-server deployment for v1
