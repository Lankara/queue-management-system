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
  createdAt: string;
  updatedAt: string | null;
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
  confirmedAt: string | null;
  calledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  noShowMarkedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface QueuePosition {
  queueNumber: string;
  status: QueueStatus;
  currentServingNumber: string | null;
  position: number;
  estimatedWaitingCount: number;
}
