export type AppointmentStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESCHEDULE_PROPOSED'
  | 'RESCHEDULE_ACCEPTED'
  | 'RESCHEDULE_REJECTED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_OPERATOR'
  | 'DELAYED'
  | 'IN_QUEUE'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'NO_SHOW';

export type AppointmentQueueSource = 'QR' | 'WEB' | 'MOBILE_APP' | 'WHATSAPP' | 'OPERATOR' | 'HARDWARE';

export interface Appointment {
  id: string;
  businessId: string;
  branchId: string | null;
  serviceId: string | null;
  customerId: string;
  clientProfileId: string;
  queueEntryId: string | null;
  requestedStartTime: Date;
  requestedEndTime: Date;
  approvedStartTime: Date | null;
  approvedEndTime: Date | null;
  status: AppointmentStatus;
  requestedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  rescheduleReason: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  queueNumber?: string | null;
  queueStatus?: string | null;
}

export interface AppointmentTimeChange {
  id: string;
  businessId: string;
  appointmentId: string;
  oldStartTime: Date | null;
  oldEndTime: Date | null;
  newStartTime: Date | null;
  newEndTime: Date | null;
  changeReason: string | null;
  changedBy: string | null;
  customerNotified: boolean;
  createdAt: Date;
}
