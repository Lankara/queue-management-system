import { Badge } from '@/components/ui/badge';
import { NotificationStatus } from '@/types/notification';

const toneByStatus: Record<NotificationStatus, 'green' | 'red' | 'slate' | 'teal'> = {
  PENDING: 'teal',
  SENT: 'green',
  FAILED: 'red',
  CANCELLED: 'slate'
};

export function NotificationStatusBadge({ status }: { status: NotificationStatus }) {
  return <Badge tone={toneByStatus[status]}>{status}</Badge>;
}
