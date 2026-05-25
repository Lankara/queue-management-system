import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { Appointment, AppointmentQueueSource, AppointmentStatus, AppointmentTimeChange } from '@/types/appointment';

export interface AppointmentFilters {
  status?: AppointmentStatus;
  customerId?: string;
  clientProfileId?: string;
  serviceId?: string;
  from?: string;
  to?: string;
}

export interface RequestAppointmentPayload {
  branchId?: string;
  serviceId: string;
  customerId: string;
  clientProfileId: string;
  requestedStartTime: string;
  requestedEndTime: string;
  requestedBy?: string;
}

export interface ApproveAppointmentPayload {
  approvedBy?: string;
  approvedStartTime?: string;
  approvedEndTime?: string;
  source?: AppointmentQueueSource;
}

export interface ReasonPayload {
  reason?: string;
}

export interface ProposeReschedulePayload {
  newStartTime: string;
  newEndTime: string;
  reason?: string;
  changedBy?: string;
}

export function listAppointments(businessId: string, filters: AppointmentFilters = {}): Promise<Appointment[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiGet<Appointment[]>(`/businesses/${businessId}/appointments${suffix}`);
}

export function getAppointment(businessId: string, id: string): Promise<Appointment> {
  return apiGet<Appointment>(`/businesses/${businessId}/appointments/${id}`);
}

export function requestAppointment(businessId: string, data: RequestAppointmentPayload): Promise<Appointment> {
  return apiPost<Appointment, RequestAppointmentPayload>(`/businesses/${businessId}/appointments/request`, data);
}

export function approveAppointment(businessId: string, id: string, data: ApproveAppointmentPayload): Promise<Appointment> {
  return apiPatch<Appointment, ApproveAppointmentPayload>(`/businesses/${businessId}/appointments/${id}/approve`, data);
}

export function rejectAppointment(businessId: string, id: string, data: ReasonPayload): Promise<Appointment> {
  return apiPatch<Appointment, ReasonPayload>(`/businesses/${businessId}/appointments/${id}/reject`, data);
}

export function cancelAppointmentByOperator(businessId: string, id: string, data: ReasonPayload): Promise<Appointment> {
  return apiPatch<Appointment, ReasonPayload>(`/businesses/${businessId}/appointments/${id}/cancel-by-operator`, data);
}

export function proposeReschedule(businessId: string, id: string, data: ProposeReschedulePayload): Promise<Appointment> {
  return apiPatch<Appointment, ProposeReschedulePayload>(`/businesses/${businessId}/appointments/${id}/propose-reschedule`, data);
}

export function acceptReschedule(businessId: string, id: string): Promise<Appointment> {
  return apiPatch<Appointment, Record<string, never>>(`/businesses/${businessId}/appointments/${id}/accept-reschedule`, {});
}

export function rejectReschedule(businessId: string, id: string, data: ReasonPayload): Promise<Appointment> {
  return apiPatch<Appointment, ReasonPayload>(`/businesses/${businessId}/appointments/${id}/reject-reschedule`, data);
}

export function listAppointmentTimeChanges(businessId: string, id: string): Promise<AppointmentTimeChange[]> {
  return apiGet<AppointmentTimeChange[]>(`/businesses/${businessId}/appointments/${id}/time-changes`);
}
