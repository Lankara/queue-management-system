export interface QueueDelayEvent {
  id: string;
  businessId: string;
  branchId: string | null;
  serviceId: string | null;
  delayMinutes: number;
  reason: string | null;
  affectedFromTime: Date;
  createdBy: string | null;
  createdAt: Date;
}

export interface AffectedAppointmentDelayResult {
  appointmentId: string;
  customerId: string;
  clientProfileId: string;
  oldStartTime: Date;
  newStartTime: Date;
  queueNumber?: string | null;
}

export interface DelayOperationResult {
  delayEvent: QueueDelayEvent;
  affectedCount: number;
  affectedAppointments: AffectedAppointmentDelayResult[];
}

export interface DelayNotificationContext extends AffectedAppointmentDelayResult {
  businessName: string;
  customerName: string;
  customerPhone: string;
  language: 'en' | 'si';
  oldEndTime: Date;
  newEndTime: Date;
}