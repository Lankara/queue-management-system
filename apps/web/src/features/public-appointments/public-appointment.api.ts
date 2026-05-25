import { publicGet, publicPatch, publicPost } from '@/lib/public-api-client';
import { PublicAppointmentRequestPayload, PublicAppointmentStatus } from '@/types/public-appointment';

export function requestPublicAppointment(businessSlug: string, data: PublicAppointmentRequestPayload): Promise<PublicAppointmentStatus> {
  return publicPost<PublicAppointmentStatus, PublicAppointmentRequestPayload>(`/public/businesses/${encodeURIComponent(businessSlug)}/appointments/request`, data);
}

export function getPublicAppointmentStatus(businessSlug: string, appointmentId: string): Promise<PublicAppointmentStatus> {
  return publicGet<PublicAppointmentStatus>(`/public/businesses/${encodeURIComponent(businessSlug)}/appointments/${appointmentId}/status`);
}

export function cancelPublicAppointment(businessSlug: string, appointmentId: string, reason?: string): Promise<PublicAppointmentStatus> {
  return publicPatch<PublicAppointmentStatus, { reason?: string }>(`/public/businesses/${encodeURIComponent(businessSlug)}/appointments/${appointmentId}/cancel`, { reason });
}

export function acceptPublicReschedule(businessSlug: string, appointmentId: string): Promise<PublicAppointmentStatus> {
  return publicPatch<PublicAppointmentStatus, Record<string, never>>(`/public/businesses/${encodeURIComponent(businessSlug)}/appointments/${appointmentId}/accept-reschedule`, {});
}

export function rejectPublicReschedule(businessSlug: string, appointmentId: string, reason?: string): Promise<PublicAppointmentStatus> {
  return publicPatch<PublicAppointmentStatus, { reason?: string }>(`/public/businesses/${encodeURIComponent(businessSlug)}/appointments/${appointmentId}/reject-reschedule`, { reason });
}
