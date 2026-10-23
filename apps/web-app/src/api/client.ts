import type { ApiErrorBody } from "@mc/shared";
import axios, { type AxiosError } from "axios";
import { useAuthStore } from "../store/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  timeout: 60_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
    return error.message;
  }
  return error instanceof Error ? error.message : "Unexpected error";
}

const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;

export async function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
) {
  return api.post(url, formData, {
    timeout: UPLOAD_TIMEOUT_MS,
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
}
