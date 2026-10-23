# Minecraft Bedrock Management Platform

Version: 1.0

## Project Overview

### Purpose

Develop a web-based administration platform for Minecraft Bedrock Server running in Docker.

The platform must provide centralized management of:
- Minecraft Bedrock Server lifecycle
- Resource Packs
- Behavior Packs
- Worlds
- Backups
- Logs
- Server configuration

The system must allow administrators to upload prepared ZIP packages containing multiple Resource Packs and Behavior Packs that can later be used when creating worlds.

Administrators should never need to manually edit Minecraft JSON configuration files.

---

# Business Goals

## Primary Goals

- Simplify Minecraft Bedrock administration.
- Centralize addon management.
- Eliminate manual file operations.
- Allow world creation from pre-imported addon libraries.
- Provide a user-friendly web interface.

## Secondary Goals

- Simplify backups.
- Provide Docker management tools.
- Support future server scaling.
- Prepare for multi-server management.

---

# Supported Deployment Environment

## Operating Systems

- Linux
- Ubuntu 22+
- Debian 12+
- Docker Host

## Container Environment

Docker Compose

## Database

PostgreSQL 16+

---

# High-Level Architecture

```text
 ┌──────────────────────┐
 │ React Frontend       │
 └──────────┬───────────┘
            │
            │ REST API
            │ WebSocket
            ▼
 ┌──────────────────────┐
 │ NestJS Backend       │
 └──────────┬───────────┘
            │
            ├────────────── PostgreSQL
            │
            ├────────────── File Storage
            │
            └────────────── Docker API
                              │
                              ▼
                    Minecraft Bedrock
```

---

# Technology Stack

## Frontend

### Framework

React

### Language

TypeScript

### UI

Ant Design

or

Material UI

### State Management

Zustand

### API Layer

Axios

### Data Caching

React Query

### Real-time Communication

Socket.IO Client

---

## Backend

### Framework

NestJS

### Language

TypeScript

### ORM

TypeORM

### Validation

class-validator

### Authentication

JWT

### File Uploads

Multer

### Docker Integration

Dockerode

### WebSockets

Socket.IO

---

## Storage

### Database

PostgreSQL

### Filesystem

Host-mounted volume

---

# Docker Structure

```text
project

├── docker-compose.yml

├── frontend/

├── backend/

├── storage/

│   ├── worlds/
│   ├── resource_packs/
│   ├── behavior_packs/
│   ├── backups/
│   ├── temp/
│   └── metadata/

└── database/
```

---

# Supported Addon Import Formats

## Resource Bundle

Supported file pattern:

```text
resource_packs_*.zip
```

Examples*

```text
resource_packs_hd.zip

*esource_packs_medieval.zip

resour*e_packs*rpg.zip
```

---

## Behavior Bund*e*

Supported file pattern:

```text
*ehavior_p*cks_*.zip
```

Examples:

```text
behavior_packs_magic.zip

behavior_packs_survival.zip

behavior_packs_animals.zip
```

---

# Bundle Structure Requirements

## Resource Pack Bundle

```text
resource_packs_hd.zip

├── BetterTrees/
│   ├── manifest.json
│   └── ...

├── BetterSky/
│   ├── manifest.json
│   └── ...

└── HDTextures/
    ├── manifest.json
    └── ...
```

---

## Behavior Pack Bundle

```text
behavior_packs_magic.zip

├── MagicMobs/
│   ├── manifest.json
│   └── ...

├── RPGSystem/
│   ├── manifest.json
│   └── ...

└── Bosses/
    ├── manifest.json
    └── ...
```

---

# Minecraft Pack Requirements

Every imported pack must contain:

```text
manifest.json
```

Minimum valid structure:

```json
{
  "header": {
    "name": "Pack Name",
    "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "version": [1, 0, 0]
  }
}
```

---

# Filesystem Layout

```text
storage/

├── resource_packs/

│   ├── BetterTrees
│   ├── BetterSky
│   └── HDTextures

├── behavior_packs/

│   ├── MagicMobs
│   ├── RPGSystem
│   └── Bosses

├── worlds/

├── backups/

├── metadata/

└── temp/
```

---

# Database Design

## Table: packs

```sql
CREATE TABLE packs (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    pack_uuid VARCHAR(255),
    version VARCHAR(50),
    type VARCHAR(20),
    folder_name VARCHAR(255),
    icon_path VARCHAR(1000),
    created_at TIMESTAMP
);
```

---

## Table: worlds

```sql
CREATE TABLE worlds (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    seed VARCHAR(255),
    gamemode VARCHAR(50),
    difficulty VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP
);
```

---

## Table: world_packs

```sql
CREATE TABLE world_packs (
    world_id UUID,
    pack_id UUID
);
```

---

## Table: backups

```sql
CREATE TABLE backups (
    id UUID PRIMARY KEY,
    world_id UUID,
    backup_path VARCHAR(1000),
    file_size BIGINT,
    created_at TIMESTAMP
);
```

---

# Pack Registry System

## Purpose

Maintain an internal catalog of imported addons.

---

## Stored Metadata

For every pack:

```json
{
  "id": "uuid",
  "name": "Magic Mobs",
  "minecraftUuid": "pack uuid",
  "version": [1, 0, 0],
  "type": "behavior",
  "path": "/behavior_packs/MagicMobs",
  "uploadedAt": "timestamp"
}
```

---

# Upload Module

## Upload Resource Bundle

```http
POST /api/upload/resource-bundle
```

Request:

```text
multipart/form-data
```

---

## Upload Behavior Bundle

```http
POST /api/upload/behavior-bundle
```

---

# ZIP Import Pipeline

## Step 1

Receive uploaded ZIP.

---

## Step 2

Store temporarily.

```text
storage/temp
```

---

## Step 3

Extract archive.

---

## Step 4

Search recursively for:

```text
manifest.json
```

---

## Step 5

Validate pack structure.

---

## Step 6

Read metadata.

Required:

```json
header.name

header.uuid

header.version
```

---

## Step 7

Check duplicate UUIDs.

---

## Step 8

Move pack into permanent storage.

---

## Step 9

Register in database.

---

## Step 10

Delete temporary files.

---

# Duplicate Resolution

If UUID already exists:

Options:

```text
Skip

Replace

Import As Copy
```

Default:

```text
Replace
```

---

# Dependency Resolver

## Goal

Automatically detect dependencies.

Many Bedrock addons contain:

```json
dependencies
```

inside:

```json
manifest.json
```

---

Example:

```json
{
  "uuid": "resource-pack-uuid"
}
```

---

System should automatically:
- discover referenced packs;
- warn user if dependency is missing;
- suggest required packs.

---

# World Management

## Create World

Endpoint:

```http
POST /api/worlds
```

Request:

```json
{
  "name": "Fantasy World",
  "seed": "123456",
  "difficulty": "normal",
  "gamemode": "survival",
  "resourcePackIds": [],
  "behaviorPackIds": []
}
```

---

# World Creation Pipeline

## Create Folder

```text
storage/worlds/Fantasy World
```

---

## Generate

```text
world_resource_packs.json
```

---

Example:

```json
[
  {
    "pack_id": "uuid",
    "version": [1, 0, 0]
  }
]
```

---

## Generate

```text
world_behavior_packs.json
```

---

Example:

```json
[
  {
    "pack_id": "uuid",
    "version": [1, 0, 0]
  }
]
```

---

## Save Pack Mappings

Store selected packs inside database.

---

## Restart Server

Restart Bedrock container automatically.

---

# Docker Management Module

## Features

### Status

```http
GET /api/server/status
```

---

### Start

```http
POST /api/server/start
```

---

### Stop

```http
POST /api/server/stop
```

---

### Restart

```http
POST /api/server/restart
```

---

### Health

```http
GET /api/server/health
```

---

# Docker Implementation

NestJS communicates with:

```text
/var/run/docker.sock
```

using:

```text
dockerode
```

---

# Logs Module

## Source

```bash
docker logs -f mc-bedrock
```

---

## Transport

WebSocket

---

## UI

Live Console

Features:
- auto-scroll
- filtering
- search
- download logs

---

# Backup Module

## Create Backup

```http
POST /api/backups
```

---

Output:

```text
world-yyyy-mm-dd-hh-mm.tar.gz
```

---

Storage:

```text
storage/backups
```

---

# Backup Restore

Endpoint:

```http
POST /api/backups/restore
```

---

Workflow:
1. Stop server.
2. Unpack archive.
3. Restore files.
4. Restart server.

---

# Frontend Pages

## Dashboard

Display:
- online status
- uptime
- memory usage
- CPU usage
- world count
- pack count

---

## Resource Packs

Functions:
- upload bundle
- list packs
- search
- delete

---

## Behavior Packs

Functions:
- upload bundle
- list packs
- search
- delete

---

## Worlds

Functions:
- create world
- delete world
- clone world
- backup world
- restore world

---

## Logs

Real-time console.

---

## Settings

Server configuration.

---

# Security Requirements

## Authentication

JWT authentication.

---

## Password Storage

bcrypt

---

## Session Expiration

12 hours

---

## Upload Validation

Validate:
- file extension
- file size
- mime type

---

Maximum upload size:

```text
500 MB
```

---

# Performance Requirements

## Import Time

Target:

```text
< 30 seconds
```

for a 500 MB archive.

---

## API Response

Target:

```text
< 300 ms
```

for normal operations.

---

# Monitoring

Metrics:
- CPU
- RAM
- Storage
- Import duration
- Backup duration
- Docker health

---

# Future Features (V2)

## Supported Formats

```text
.mcpack
```

```text
.mcaddon
```

```text
.mcworld
```

---

## Multi-Server Management

```text
Bedrock Survival

Bedrock Creative

Bedrock Modded
```

---

## User Roles

```text
ADMIN

MODERATOR

VIEWER
```

---

## Scheduled Backups

Cron jobs.

---

## Marketplace Integration

Pack catalog.

---

## Automated Compatibility Validation

Minecraft version checks.

---

# Acceptance Criteria

The implementation is considered complete when:
- ZIP bundle uploads work.
- Packs are automatically detected.
- Packs are registered in the database.
- Duplicate packs are handled correctly.
- Resource Packs are visible in UI.
- Behavior Packs are visible in UI.
- New worlds can be created using imported packs.
- World configuration files are generated automatically.
- Docker server can be restarted from UI.
- Logs are visible in real time.
- Backups can be created.
- Backups can be restored.
- No manual filesystem operations are required by administrators.
