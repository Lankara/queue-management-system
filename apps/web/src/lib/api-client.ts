import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import { ApiEnvelope } from '@/types/api';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);

export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiClient.get<ApiEnvelope<T> | T>(url);
  return unwrapApiResponse(response.data);
}

export async function apiPost<TResponse, TBody>(url: string, body: TBody): Promise<TResponse> {
  const response = await apiClient.post<ApiEnvelope<TResponse> | TResponse>(url, body);
  return unwrapApiResponse(response.data);
}

export async function apiPatch<TResponse, TBody>(url: string, body: TBody): Promise<TResponse> {
  const response = await apiClient.patch<ApiEnvelope<TResponse> | TResponse>(url, body);
  return unwrapApiResponse(response.data);
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiClient.delete<ApiEnvelope<T> | T>(url);
  return unwrapApiResponse(response.data);
}

export function unwrapApiResponse<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}



