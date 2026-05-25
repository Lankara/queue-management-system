import { Badge } from '@/components/ui/badge';
import { AppointmentStatus } from '@/types/appointment';
import { appointmentStatusConfig } from './appointment-status-config';

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const config = appointmentStatusConfig[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
