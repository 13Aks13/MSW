# Tasks: Async Pack Import with Worker and Real-Time Progress

**Input**: Design documents from `/specs/002-async-pack-import/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [ ] T001 Add Redis/BullMQ dependencies to core-api package.
- [ ] T002 [P] Add WebSocket client dependency to web-app if missing.
- [ ] T003 [P] Add shared async import job types to packages/shared/src/api.ts.

## Phase 2: Foundational

- [ ] T004 Create ImportJob entity and TypeORM registration.
- [ ] T005 [P] Create queue module and BullMQ queue provider.
- [ ] T006 [P] Create job status service/repository wrapper.
- [ ] T007 Add 20 MB threshold routing in packs controller/service.
- [ ] T008 [P] Add import job status endpoint.
- [ ] T009 [P] Add WebSocket gateway event contracts.

## Phase 3: User Story 1 - Large bundle imports without timeouts (P1)

- [ ] T010 [US1] Add async upload endpoint returning jobId.
- [ ] T011 [US1] Implement worker processor reusing PackImportService.
- [ ] T012 [US1] Persist job state and final report.
- [ ] T013 [US1] Add worker cleanup for temp files.
- [ ] T014 [US1] Add polling status endpoint tests.

## Phase 4: User Story 2 - Interactive progress (P1)

- [ ] T015 [US2] Emit progress/step/log events from PackImportService callbacks.
- [ ] T016 [US2] Publish events through Socket.IO gateway.
- [ ] T017 [US2] Subscribe web client to job room.
- [ ] T018 [US2] Render live progress and logs in PacksPage.
- [ ] T019 [US2] Add fallback polling when WebSocket disconnects.

## Phase 5: User Story 3 - Small bundle fallback (P2)

- [ ] T020 [US3] Keep <= 20 MB synchronous import path unchanged.
- [ ] T021 [US3] Ensure report modal and error modal still work.
- [ ] T022 [US3] Add tests for threshold routing.

## Phase 6: Polish

- [ ] T023 [P] Update docs and docker compose Redis service.
- [ ] T024 [P] Add end-to-end smoke test for large import.
- [ ] T025 Run typecheck, lint, tests, build.
