import { Card } from '@/components/ui/card';
import { Branch, Service } from '@/types/business-setup';
import { Appointment } from '@/types/appointment';

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not set';
}

export function QueueAssignmentCard({ appointment, branch, service }: { appointment: Appointment; branch?: Branch; service?: Service }) {
  return (
    <Card className="grid gap-3 border-teal-200 bg-teal-50">
      <p className="text-sm font-semibold text-teal-950">Queue assignment</p>
      <p className="text-4xl font-bold text-teal-950">{appointment.queueNumber ?? 'Pending'}</p>
      <div className="grid gap-1 text-sm text-teal-900">
        <p>Status: {appointment.queueStatus ?? (appointment.queueNumber ? 'CONFIRMED' : 'Not assigned')}</p>
        <p>Branch: {branch?.name ?? 'Any branch'}</p>
        <p>Service: {service?.name ?? 'Service not set'}</p>
        <p>Approved time: {formatDateTime(appointment.approvedStartTime)}</p>
      </div>
    </Card>
  );
}
