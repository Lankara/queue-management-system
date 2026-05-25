export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface HealthResponse {
  status: 'ok';
  service: string;
}
