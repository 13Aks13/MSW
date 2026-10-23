# Data Model: Minecraft Bedrock Management Platform

**Feature**: 001-bedrock-server-management  
**Date**: 2026-10-23  
**Source**: `specs/001-bedrock-server-management/spec.md` (Key Entities)

---

## Entities

### Server

Represents the Minecraft Bedrock Server instance managed by the platform.

**Key attributes**:
- `id`: unique server identifier
- `status`: online / offline / starting / stopping / error
- `uptime`: duration the server has been running
- `memoryUsage`: current memory consumption
- `cpuUsage`: current CPU consumption
- `configuration`: reference to Configuration (server.properties values)
- `lastModified`: timestamp of last status/configuration change

**Validation rules**:
- `status` MUST be one of: online, offline, starting, stopping, error
- `memoryUsage` and `cpuUsage` MUST be non-negative

**State transitions**:
- `offline → starting` (start action)
- `starting → online` (start succeeded)
- `starting → error` (start failed)
- `online → stopping` (stop action)
- `stopping → offline` (stop succeeded)
- `online → error` (runtime failure)
- `error → offline` (manual reset after failure)

---

### World

Represents a Minecraft world with associated addon packs.

**Key attributes**:
- `id`: unique world identifier
- `name`: world display name
- `resourcePacks`: set of associated Resource Pack references
- `behaviorPacks`: set of associated Behavior Pack references
- `backupHistory`: list of associated Backup references
- `storageLocation`: filesystem path to world files
- `createdAt`: creation timestamp
- `updatedAt`: last modification timestamp

**Validation rules**:
- `name` MUST be unique among worlds
- A world MUST reference at least zero packs (packs optional)
- `storageLocation` MUST point to a valid directory under `storage/worlds`

**State transitions**:
- `created → active` (world ready for use)
- `active → archived` (world deleted)

---

### Resource Pack

Represents a client-side visual asset pack.

**Key attributes**:
- `id`: unique pack identifier
- `name`: pack display name
- `version`: pack version string
- `sourceFile`: reference to the uploaded ZIP/archive file
- `registrationStatus`: registered / failed / pending

**Validation rules**:
- `name` + `version` MUST be unique among Resource Packs
- `registrationStatus` MUST be one of: registered, failed, pending

---

### Behavior Pack

Represents a server-side behavior asset pack.

**Key attributes**:
- `id`: unique pack identifier
- `name`: pack display name
- `version`: pack version string
- `sourceFile`: reference to the uploaded ZIP/archive file
- `registrationStatus`: registered / failed / pending

**Validation rules**:
- `name` + `version` MUST be unique among Behavior Packs
- `registrationStatus` MUST be one of: registered, failed, pending

---

### Backup

Represents a point-in-time archive of a world.

**Key attributes**:
- `id`: unique backup identifier
- `name`: backup display name
- `createdAt`: creation timestamp
- `sourceWorld`: reference to the World being backed up
- `archiveLocation`: filesystem path to the backup archive
- `size`: archive size in bytes

**Validation rules**:
- `sourceWorld` MUST reference an existing World
- `archiveLocation` MUST point to a valid file under `storage/backups`

---

### Configuration

Represents server settings (`server.properties`).

**Key attributes**:
- `id`: unique configuration identifier
- `settings`: map of individual `server.properties` key/value pairs
- `lastModified`: timestamp of last change

**Validation rules**:
- Each setting key/value MUST conform to valid `server.properties` syntax

---

### Log Entry

Represents a single line of server console output.

**Key attributes**:
- `id`: unique log entry identifier
- `timestamp`: when the log line was produced
- `level`: info / warning / error
- `message`: log text content

**Validation rules**:
- `level` MUST be one of: info, warning, error

---

### User

Represents an authenticated administrator.

**Key attributes**:
- `id`: unique user identifier
- `credentials`: authentication credentials (JWT subject)
- `role`: administrator role

**Validation rules**:
- `role` MUST be administrator for management actions

---

## Relationships

- **Server** 1:1 **Configuration** — one server has one configuration
- **World** 1:N **Backup** — one world has many backups
- **World** N:M **Resource Pack** — worlds share resource packs
- **World** N:M **Behavior Pack** — worlds share behavior packs
- **Backup** N:1 **World** — each backup belongs to one world
- **User** 1:N **management actions** — one user performs many actions (audit implied)
