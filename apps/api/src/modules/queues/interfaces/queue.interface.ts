export type QueueStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'WAITING'
  | 'CALLED'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type QueueSource = 'QR' | 'WEB' | 'MOBILE_APP' | 'WHATSAPP' | 'OPERATOR' | 'HARDWARE';

export interface Queue {
  id: string;
  businessId: string;
  branchId: string | null;
  serviceId: string | null;
  queueDate: string;
  code: string;
  currentNumber: string | null;
  lastIssuedNumber: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface QueueEntry {
  id: string;
  businessId: string;
  queueId: string;
  branchId: string | null;
  serviceId: string | null;
  customerId: string;
  clientProfileId: string;
  queueNumber: string;
  queueSequence: number;
  status: QueueStatus;
  source: QueueSource;
  serviceDate: string;
  confirmedAt: Date | null;
  calledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  noShowMarkedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface QueuePosition {
  queueNumber: string;
  status: QueueStatus;
  currentServingNumber: string | null;
  position: number;
  estimatedWaitingCount: number;
}