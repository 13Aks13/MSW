# Research: Async Pack Import

## Decision: BullMQ + Redis

Use BullMQ with Redis for durable, retryable background jobs with progress reporting.

## Decision: Socket.IO progress channel

Reuse the existing Socket.IO infrastructure to push import events to authenticated clients.

## Decision: 20 MB threshold

Bundles above 20 MB use async processing; smaller bundles retain synchronous behavior.

## Decision: PostgreSQL job state

Persist job metadata in PostgreSQL so status survives refresh and API restarts.
