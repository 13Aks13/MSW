# Feature Specification: Async Pack Import with Worker and Real-Time Progress

**Feature Branch**: `002-async-pack-import`
**Created**: 2026-10-24
**Status**: Draft
**Input**: User description: "Add BullMQ worker and WebSocket progress for large pack imports over 20MB"

## User Scenarios & Testing

### User Story 1 - Large bundle imports without request timeouts (Priority: P1)

An administrator uploads a large pack bundle (over 20 MB). The platform accepts the upload immediately, processes extraction/installation in a background worker, and reports completion without holding the browser request open.

**Why this priority**: Large bundles currently risk HTTP timeouts and block the UI.

**Independent Test**: Upload a bundle larger than 20 MB and verify the API returns a job id immediately while processing continues asynchronously.

**Acceptance Scenarios**:
1. **Given** a bundle larger than 20 MB, **When** the user uploads it, **Then** the response returns a job id and status "queued" within 2 seconds.
2. **Given** a queued large import, **When** processing completes, **Then** the pack appears in the pack list and the job status becomes "completed".

### User Story 2 - Interactive progress for all imports (Priority: P1)

During any import, the user sees live progress and step-by-step logs in the import dialog, including extraction, manifest scanning, installation, and cleanup.

**Why this priority**: Users need visibility into long-running imports and confidence that the system is working.

**Independent Test**: Start an import and observe progress/log updates arriving over WebSocket before completion.

**Acceptance Scenarios**:
1. **Given** an active import, **When** progress changes, **Then** the progress bar and current step update in real time.
2. **Given** an active import, **When** a log line is emitted, **Then** it appears in the import log panel without manual refresh.

### User Story 3 - Safe fallback for small bundles (Priority: P2)

Bundles 20 MB or smaller continue to use the existing synchronous import path and return the full import report directly.

**Why this priority**: Avoids unnecessary queueing for common small uploads and preserves current behavior.

**Independent Test**: Upload a bundle of 20 MB or less and verify the existing report modal flow still works.

**Acceptance Scenarios**:
1. **Given** a bundle 20 MB or smaller, **When** uploaded, **Then** the import completes through the existing synchronous endpoint.
2. **Given** a bundle 20 MB or smaller, **When** processing fails, **Then** the existing modal error flow is used.

### Edge Cases

- What happens when Redis or the worker is unavailable? The API should reject large uploads with a clear error and keep small uploads working.
- How does the system handle a worker crash mid-import? The job should be marked failed, temporary files cleaned, and the user notified through WebSocket and polling fallback.
- What happens when the user closes the browser during a large import? The job continues server-side and the result is available when they return.
- How are duplicate uploads handled? Each upload creates a distinct job id and temporary workspace.

## Requirements

### Functional Requirements

- **FR-001**: System MUST route bundles larger than 20 MB to an asynchronous import job.
- **FR-002**: System MUST process asynchronous imports in a separate worker process.
- **FR-003**: System MUST expose job status, progress, current step, logs, and final report through an API.
- **FR-004**: System MUST push progress, step, log, completion, and failure events to subscribed clients over WebSocket.
- **FR-005**: System MUST retain the synchronous import path for bundles 20 MB or smaller.
- **FR-006**: System MUST persist enough job state to recover status after a page refresh.
- **FR-007**: System MUST clean temporary files for completed, failed, and cancelled jobs.
- **FR-008**: System MUST prevent unsafe archive extraction in the worker using the existing zip limits.
- **FR-009**: System MUST support retrying failed jobs without re-uploading the file when retention permits.
- **FR-010**: System MUST authenticate WebSocket subscriptions using the existing auth mechanism.

### Key Entities

- **ImportJob**: Represents one bundle import request; stores job id, bundle type, policy, file path, status, progress, current step, logs, report, error, timestamps.
- **ImportProgressEvent**: Real-time event emitted by the worker; includes job id, progress percentage, step, optional log line, and terminal status.
- **ImportReport**: Existing report returned for synchronous imports and for completed asynchronous jobs.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can upload bundles larger than 20 MB without browser or API request timeout.
- **SC-002**: Users see progress updates at least every 2 seconds during active large imports.
- **SC-003**: 95% of large imports either complete or report a clear failure without manual server inspection.
- **SC-004**: Small imports retain their current end-to-end behavior and report modal.

## Assumptions

- Redis is available in the deployment environment for BullMQ.
- The existing PackImportService can be reused by the worker with minimal changes.
- WebSocket clients are authenticated with the same JWT/session used by the REST API.
- Large file retention is limited to a configurable TTL to avoid unbounded storage.
