import type { ServerPropertyDto } from '@mc/shared';
import { api } from './client';

export async function listServerProperties(): Promise<ServerPropertyDto[]> {
  const { data } = await api.get<ServerPropertyDto[]>('/settings/server-properties');
  return data;
}

export async function updateServerProperties(
  values: Record<string, string>,
): Promise<ServerPropertyDto[]> {
  const { data } = await api.put<ServerPropertyDto[]>('/settings/server-properties', values);
  return data;
}

export async function applySettings(): Promise<void> {
  await api.post('/settings/apply');
}
