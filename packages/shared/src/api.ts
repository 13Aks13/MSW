import type { BackupStatus, DuplicatePolicy, PackType, UserRole, WorldStatus } from "./domain.js";

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PackVersion {
  raw: string;
  array: number[];
}

export interface PackDependency {
  uuid: string;
  version?: number[];
  missing?: boolean;
  resolvedPackId?: string | null;
}

export interface PackDto {
  id: string;
  name: string;
  packUuid: string;
  version: string;
  versionArray: number[];
  type: PackType;
  folderName: string;
  iconPath: string | null;
  sizeBytes: string;
  dependencies: PackDependency[];
  sourceBundle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportIssue {
  level: "warning" | "error";
  message: string;
  pack?: string;
}

export interface ImportReport {
  imported: PackDto[];
  skipped: string[];
  replaced: string[];
  warnings: ImportIssue[];
  errors: ImportIssue[];
  durationMs: number;
  bundleType: PackType;
  duplicatePolicy: DuplicatePolicy;
  logs: string[];
}

export interface WorldPackDto {
  id: string;
  name: string;
  packUuid: string;
  version: string;
  versionArray: number[];
  type: PackType;
}

export interface CreateWorldDto {
  name: string;
  seed?: string;
  gamemode?: "survival" | "creative" | "adventure";
  difficulty?: "peaceful" | "easy" | "normal" | "hard";
  resourcePackIds?: string[];
  behaviorPackIds?: string[];
}

export interface WorldDto {
  id: string;
  name: string;
  slug: string;
  seed: string | null;
  gamemode: string;
  difficulty: string;
  status: WorldStatus;
  folderName: string;
  sizeBytes: string;
  packs: WorldPackDto[];
  lastBackupAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackupDto {
  id: string;
  worldId: string | null;
  worldName: string;
  fileName: string;
  sizeBytes: string;
  status: BackupStatus;
  createdAt: string;
}

export interface ServerStatusDto {
  containerName: string;
  exists: boolean;
  state: "running" | "stopped" | "paused" | "restarting" | "unknown";
  image: string | null;
  startedAt: string | null;
  uptimeSeconds: number;
  health: string | null;
  playersOnline: number | null;
}

export interface ServerStatsDto {
  cpuPercent: number;
  memoryUsageBytes: number;
  memoryLimitBytes: number;
  memoryPercent: number;
  networkRxBytes: number;
  networkTxBytes: number;
  collectedAt: string;
}

export interface DashboardDto {
  server: ServerStatusDto;
  stats: ServerStatsDto | null;
  packs: Record<PackType, number>;
  worlds: number;
  backups: number;
  storageUsedBytes: string;
  storageFreeBytes: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginResponseDto {
  accessToken: string;
  expiresIn: number;
  user: AuthUserDto;
}

export interface LogLineDto {
  stream: "stdout" | "stderr" | "system";
  message: string;
  timestamp: string;
}

export interface ServerPropertyDto {
  key: string;
  label: string;
  value: string;
  type: "string" | "number" | "boolean" | "enum";
  options?: string[];
  restartRequired?: boolean;
  readOnly?: boolean;
}

export type ImportJobStatus = "queued" | "active" | "completed" | "failed" | "cancelled";

export interface ImportJobDto {
  id: string;
  bundleType: PackType;
  duplicatePolicy: DuplicatePolicy;
  status: ImportJobStatus;
  progress: number;
  currentStep: string;
  logs: string[];
  report: ImportReport | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}
export interface HealthDto {
  status: "ok" | "degraded";
  checks: Array<{
    name: string;
    status: "up" | "down";
    message?: string;
    latencyMs?: number;
  }>;
  version: string;
  timestamp: string;
}
