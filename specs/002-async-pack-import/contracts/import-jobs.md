# Import Job Contracts

## POST /packs/import (existing, <= 20 MB)

Returns ImportReport.

## POST /packs/import/async (> 20 MB)

Request: multipart form with file, type, policy.
Response: `{ jobId: string, status: "queued" }`.

## GET /packs/import/jobs/:id

Response: `{ id, status, progress, currentStep, logs, report, error }`.

## WebSocket event: import:progress

Payload: `{ jobId, progress, step, log?, status, report?, error? }`.
