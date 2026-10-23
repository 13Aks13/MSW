# Quickstart Validation Guide: Minecraft Bedrock Management Platform

**Feature**: 001-bedrock-server-management  
**Date**: 2026-10-23  
**Purpose**: Runnable validation scenarios proving the feature works end-to-end.  
**References**: `data-model.md`, `contracts/api.md`

---

## Prerequisites

- Node.js >= 24.11.0, pnpm >= 10
- Docker & Docker Compose
- Repository cloned at `/Users/aks13/Projects/Minecraft`
- `.env` configured (copy from `.env.example`)

---

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start all services (Traefik, PostgreSQL, core-api, web-app, Bedrock server)
pnpm compose:up

# 3. Wait for services to be healthy, then view logs
pnpm compose:logs --tail=50
```

Expected: all containers report `healthy`; API available at `http://localhost:3000`; web UI at `http://localhost:5173`.

---

## Validation Scenario 1 — Server lifecycle (start/stop/restart)

**Goal**: Administrator can control the server from the UI without SSH/Docker CLI.
1. Open the web UI, navigate to Dashboard.
2. Confirm initial status indicator shows `online` or `offline`.
3. Click **Stop**. Expected: status transitions to `offline` within 1 minute; server process stops.
4. Click **Start**. Expected: status transitions to `online` within 1 minute; server process starts.
5. Click **Restart**. Expected: server stops and starts again; status returns to `online`.

**Reference**: `contracts/api.md` → Server Lifecycle (`POST /api/servers/{start,stop,restart}`, `GET /api/servers/status`).

---

## Validation Scenario 2 — ZIP pack upload and management

**Goal**: Packs are automatically detected and registered from a ZIP bundle; no manual JSON editing.
1. Prepare a ZIP bundle containing valid Resource Pack and Behavior Pack folders.
2. Navigate to Resource Packs / Behavior Packs page.
3. Upload the ZIP. Expected: upload completes within 30 seconds for ≤ 500 MB; packs appear in their respective lists.
4. Confirm packs are registered (not in `failed`/`pending` state).
5. Delete one pack. Expected: pack removed from UI and unavailable for world creation.
6. Upload an invalid/corrupted ZIP. Expected: upload rejected with a user-friendly error.

**Reference**: `contracts/api.md` → Packs (`POST /api/packs/upload`, `GET /api/packs`, `DELETE /api/packs/:id`); `data-model.md` → Resource Pack / Behavior Pack validation rules.

---

## Validation Scenario 3 — World creation with imported packs

**Goal**: New world created using imported packs; configuration files generated automatically.
1. Confirm at least one Resource Pack and one Behavior Pack are registered.
2. Navigate to Worlds page, click **Create World**.
3. Select pack(s) and provide a world name. Expected: world appears in world list; world configuration files generated automatically under `storage/worlds/`.
4. Clone the world. Expected: a copy with a new name appears and is independently manageable.
5. Delete the world. Expected: world and its files removed; no longer listed.

**Reference**: `contracts/api.md` → Worlds (`POST /api/worlds`, `DELETE /api/worlds/:id`, `POST /api/worlds/:id/clone`); `data-model.md` → World entity.

---

## Validation Scenario 4 — Backup and restore

**Goal**: Backups created and restored without data loss; restored world matches backed-up state.
1. Select an existing world, click **Backup**. Expected: backup archive produced and listed under Backups.
2. Modify the world (e.g., change a setting or add content).
3. Restore from the backup. Expected: world files replaced with backup contents; world reflects the backed-up state exactly.

**Reference**: `contracts/api.md` → Backups (`POST /api/worlds/:id/backup`, `POST /api/backups/restore`).

---

## Validation Scenario 5 — Real-time logs

**Goal**: Server console output visible in the web UI with low latency.
1. Open the Logs page while the server is running.
2. Expected: live console output appears and updates within 5 seconds of new log lines.

**Reference**: `contracts/api.md` → Logs (WebSocket `/logs`, `log:line` event).

---

## Validation Scenario 6 — Server configuration

**Goal**: `server.properties` editable via UI without manual file editing.
1. Navigate to Settings page.
2. Change a configuration value and save. Expected: configuration file updated automatically; server applies the new value.

**Reference**: `contracts/api.md` → Configuration (`GET /api/config`, `PUT /api/config`).

---

## Validation Scenario 7 — Authentication

**Goal**: All management actions require administrator authentication.
1. Attempt to access a management endpoint without a valid JWT. Expected: rejected (HTTP 401).
2. Log in with valid credentials. Expected: JWT issued; management actions succeed.

**Reference**: `contracts/api.md` → Authentication (`POST /api/auth/login`).

---

## Success criteria (from spec)

| Criterion                                            | How validated |
| ---------------------------------------------------- | ------------- |
| Start/stop/restart in under 1 minute                 | Scenario 1    |
| ZIP ≤ 500 MB upload and packs visible within 30 s    | Scenario 2    |
| World created with packs, zero manual filesystem ops | Scenario 3    |
| Backup/restore without data loss                     | Scenario 4    |
| Logs visible within 5 s                              | Scenario 5    |
| All actions require authentication                   | Scenario 7    |

If all scenarios pass, the feature is validated end-to-end and ready for implementation tasks (`/speckit-tasks`).
