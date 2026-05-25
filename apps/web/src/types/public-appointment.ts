import { AppointmentStatus } from './appointment';

export interface PublicAppointmentStatus {
  appointmentId: string;
  status: AppointmentStatus;
  requestedStartTime: string;
  requestedEndTime: string;
  approvedStartTime: string | null;
  approvedEndTime: string | null;
  queueEntryId: string | null;
  queueNumber: string | null;
  queueStatus: string | null;
  serviceName: string;
  branchName: string | null;
  customerName: string;
  cancellationReason: string | null;
  rescheduleReason: string | null;
  message: string;
}

export interface PublicAppointmentRequestPayload {
  branchId?: string;
  serviceId: string;
  customerId: string;
  clientProfileId: string;
  requestedStartTime: string;
  requestedEndTime: string;
}

