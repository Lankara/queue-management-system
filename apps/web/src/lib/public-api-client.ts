import axios from 'axios';
import { ApiEnvelope } from '@/types/api';

export const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

export const publicApiClient = axios.create({
  baseURL: PUBLIC_API_BASE_URL,
  headers: { Accept: 'application/json', 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
});

export async function publicGet<T>(url: string): Promise<T> {
  const response = await publicApiClient.get<ApiEnvelope<T> | T>(url);
  return unwrapPublicResponse(response.data);
}

export async function publicPost<TResponse, TBody>(url: string, body: TBody): Promise<TResponse> {
  const response = await publicApiClient.post<ApiEnvelope<TResponse> | TResponse>(url, body);
  return unwrapPublicResponse(response.data);
}

export async function publicPatch<TResponse, TBody>(url: string, body: TBody): Promise<TResponse> {
  const response = await publicApiClient.patch<ApiEnvelope<TResponse> | TResponse>(url, body);
  return unwrapPublicResponse(response.data);
}

function unwrapPublicResponse<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}
