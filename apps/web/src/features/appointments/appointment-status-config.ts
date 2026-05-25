import { AppointmentStatus } from '@/types/appointment';

export type AppointmentTone = 'green' | 'red' | 'slate' | 'teal';

export const appointmentStatusConfig: Record<AppointmentStatus, { label: string; tone: AppointmentTone; message: string }> = {
  PENDING_APPROVAL: { label: 'Pending approval', tone: 'teal', message: 'Your appointment request is pending approval.' },
  APPROVED: { label: 'Approved', tone: 'green', message: 'Your appointment has been approved.' },
  REJECTED: { label: 'Rejected', tone: 'red', message: 'Your appointment request was rejected.' },
  RESCHEDULE_PROPOSED: { label: 'Reschedule proposed', tone: 'teal', message: 'Your appointment has a proposed new time.' },
  RESCHEDULE_ACCEPTED: { label: 'Reschedule accepted', tone: 'green', message: 'The proposed reschedule was accepted.' },
  RESCHEDULE_REJECTED: { label: 'Reschedule rejected', tone: 'red', message: 'The proposed reschedule was rejected.' },
  CANCELLED_BY_CUSTOMER: { label: 'Cancelled by customer', tone: 'red', message: 'This appointment was cancelled.' },
  CANCELLED_BY_OPERATOR: { label: 'Cancelled by operator', tone: 'red', message: 'This appointment was cancelled by staff.' },
  DELAYED: { label: 'Delayed', tone: 'teal', message: 'This appointment is delayed.' },
  IN_QUEUE: { label: 'In queue', tone: 'teal', message: 'You are now in the queue.' },
  IN_SERVICE: { label: 'In service', tone: 'green', message: 'Service is in progress.' },
  COMPLETED: { label: 'Completed', tone: 'slate', message: 'This appointment is completed.' },
  NO_SHOW: { label: 'No show', tone: 'red', message: 'This appointment was marked as no-show.' }
};

export function getAppointmentStatusLabel(status: AppointmentStatus | string): string {
  return appointmentStatusConfig[status as AppointmentStatus]?.label ?? status.toLowerCase().replace(/_/g, ' ');
}

export function getAppointmentStatusMessage(status: AppointmentStatus | string): string {
  return appointmentStatusConfig[status as AppointmentStatus]?.message ?? 'Appointment status updated.';
}
