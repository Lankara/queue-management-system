export interface QueueDelayEvent {
  id: string;
  businessId: string;
  branchId: string | null;
  serviceId: string | null;
  delayMinutes: number;
  reason: string | null;
  affectedFromTime: string;
  createdBy: string | null;
  createdAt: string;
}

export interface AffectedAppointmentDelayResult {
  appointmentId: string;
  customerId: string;
  clientProfileId: string;
  oldStartTime: string;
  newStartTime: string;
  queueNumber?: string | null;
}

export interface DelayOperationResult {
  delayEvent: QueueDelayEvent;
  affectedCount: number;
  affectedAppointments: AffectedAppointmentDelayResult[];
}
