# API Contract: Minecraft Bedrock Management Platform

**Feature**: 001-bedrock-server-management  
**Date**: 2026-10-23  
**Interface type**: Web service — REST API (HTTP/JSON) + WebSocket (Socket.IO)  
**Consumers**: React frontend (`apps/web-app`), administrators via web UI

---

## Authentication

All management endpoints require a valid JWT (`Authorization: Bearer <token>`).  
Auth endpoints are public.

- `POST /api/auth/login` — authenticate administrator, returns JWT
- `POST /api/auth/logout` — invalidate session

---

## Server Lifecycle

- `POST /api/servers/start` — start the Minecraft Bedrock Server
- `POST /api/servers/stop` — stop the server gracefully
- `POST /api/servers/restart` — restart the server
- `GET /api/servers/status` — return current server status (online/offline/starting/stopping/error), uptime, memory, CPU

---

## Packs (Resource & Behavior)

- `POST /api/packs/upload` — upload ZIP bundle; multipart form with `file` field; validates extension, size (≤ 500 MB), MIME type; auto-detects and registers packs
- `GET /api/packs` — list all registered Resource Packs and Behavior Packs
- `DELETE /api/packs/:id` — delete a pack by id

---

## Worlds

- `POST /api/worlds` — create a new world; body: name, resourcePackIds[], behaviorPackIds[]
- `GET /api/worlds` — list all worlds with associated packs
- `DELETE /api/worlds/:id` — delete a world and its files
- `POST /api/worlds/:id/clone` — clone a world with a new name
- `POST /api/worlds/:id/backup` — create a backup archive of a world
- `POST /api/worlds/:id/restore` — restore a world from a backup archive

---

## Backups

- `GET /api/backups` — list all backup archives
- `POST /api/backups/restore` — restore a world from a selected backup archive

---

## Logs (WebSocket, Socket.IO)

- Socket.IO namespace `/logs` — real-time server console output streamed to connected clients
- Events: `log:line` (new log entry), `server:status` (status change)

---

## Configuration

- `GET /api/config` — return current `server.properties` settings
- `PUT /api/config` — update server configuration values

---

## Response Conventions

- All responses are JSON.
- Success: `{ "data": ... }` with HTTP 200/201.
- Error: `{ "error": { "code": "...", "message": "user-friendly message" } }` with appropriate HTTP 4xx/5xx.
- Validation errors (upload size, file type, duplicate names) return user-friendly messages without exposing internals.
