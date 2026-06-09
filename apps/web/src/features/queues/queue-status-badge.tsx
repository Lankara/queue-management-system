import { Badge } from '@/components/ui/badge';
import { QueueStatus } from '@/types/queue';

const toneByStatus: Record<QueueStatus, 'green' | 'red' | 'slate' | 'teal'> = {
  DRAFT: 'slate',
  CONFIRMED: 'teal',
  WAITING: 'teal',
  CALLED: 'green',
  IN_SERVICE: 'green',
  COMPLETED: 'slate',
  SKIPPED: 'red',
  CANCELLED: 'red',
  NO_SHOW: 'red'
};

export function QueueStatusBadge({ status }: { status: QueueStatus }) {
  const label = status === 'DRAFT' ? 'PENDING_APPROVAL' : status;
  return <Badge tone={toneByStatus[status]}>{label}</Badge>;
}
