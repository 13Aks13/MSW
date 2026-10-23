import type { BackupDto, Paginated } from "@mc/shared";
import { api } from "./client";

export async function listBackups(page = 1, limit = 50): Promise<Paginated<BackupDto>> {
  const { data } = await api.get<Paginated<BackupDto>>("/backups", { params: { page, limit } });
  return data;
}

export async function createBackup(worldId?: string): Promise<BackupDto> {
  const { data } = await api.post<BackupDto>("/backups", worldId ? { worldId } : {});
  return data;
}

export async function restoreBackup(id: string, worldId: string): Promise<BackupDto> {
  const { data } = await api.post<BackupDto>(`/backups/${id}/restore`, { worldId });
  return data;
}

export async function deleteBackup(id: string): Promise<void> {
  await api.delete(`/backups/${id}`);
}

export async function downloadBackup(id: string, fileName: string): Promise<void> {
  const { data } = await api.get<Blob>(`/backups/${id}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
