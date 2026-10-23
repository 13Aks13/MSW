import type {
  DuplicatePolicy,
  ImportReport,
  PackDependency,
  PackDto,
  PackType,
  Paginated,
} from "@mc/shared";
import { api, uploadWithProgress } from "./client";

export interface ListPacksParams {
  type?: PackType;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listPacks(params: ListPacksParams): Promise<Paginated<PackDto>> {
  const { data } = await api.get<Paginated<PackDto>>("/packs", { params });
  return data;
}

export async function importBundle(
  file: File,
  type: PackType,
  duplicatePolicy: DuplicatePolicy,
  onProgress?: (percent: number) => void,
): Promise<ImportReport> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await uploadWithProgress(
    `/packs/import?type=${type}&onDuplicate=${duplicatePolicy}`,
    form,
    onProgress,
  );
  return data as ImportReport;
}

export async function deletePack(id: string): Promise<void> {
  await api.delete(`/packs/${id}`);
}

export async function packDependencies(id: string): Promise<PackDependency[]> {
  const { data } = await api.get<PackDependency[]>(`/packs/${id}/dependencies`);
  return data;
}

export function packIconUrl(id: string): string {
  const base = import.meta.env.VITE_API_URL ?? "/api/v1";
  return `${base}/packs/${id}/icon`;
}
