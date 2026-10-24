import type {
  AllowListDto,
  AllowListEntry,
  DashboardDto,
  ServerStatsDto,
  ServerStatusDto,
} from "@mc/shared";
import { api } from "./client";

export async function getDashboard(): Promise<DashboardDto> {
  const { data } = await api.get<DashboardDto>("/server/dashboard");
  return data;
}

export async function getServerStatus(): Promise<ServerStatusDto> {
  const { data } = await api.get<ServerStatusDto>("/server/status");
  return data;
}

export async function getServerStats(): Promise<ServerStatsDto> {
  const { data } = await api.get<ServerStatsDto>("/server/stats");
  return data;
}

export async function serverAction(action: "start" | "stop" | "restart"): Promise<void> {
  await api.post(`/server/${action}`);
}

export async function sendCommand(command: string): Promise<string> {
  const { data } = await api.post<{ output: string }>("/server/command", { command });
  return data.output;
}

export async function downloadServerLogs(tail = 2000): Promise<Blob> {
  const { data } = await api.get<Blob>("/server/logs", {
    params: { tail },
    responseType: "blob",
  });
  return data;
}

export async function getAllowlist(): Promise<AllowListDto> {
  const { data } = await api.get<AllowListDto>("/server/allowlist");
  return data;
}

export async function addToAllowlist(entry: AllowListEntry): Promise<AllowListDto> {
  const { data } = await api.post<AllowListDto>("/server/allowlist", entry);
  return data;
}

export async function removeFromAllowlist(name: string): Promise<AllowListDto> {
  const { data } = await api.delete<AllowListDto>(`/server/allowlist/${encodeURIComponent(name)}`);
  return data;
}

export async function clearAllowlist(): Promise<void> {
  await api.delete("/server/allowlist");
}
