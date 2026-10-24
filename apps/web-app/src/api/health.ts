import type { HealthDto } from "@mc/shared";
import { api } from "./client";

export async function getHealth(): Promise<HealthDto> {
  const { data } = await api.get<HealthDto>("/health");
  return data;
}
