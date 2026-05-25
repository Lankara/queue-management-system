'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAppointmentStatusLabel, getAppointmentStatusMessage } from '@/features/appointments/appointment-status-config';
import { PublicAppointmentStatus } from '@/types/public-appointment';
import { QueuePosition } from '@/types/queue';

const cancellable = ['PENDING_APPROVAL', 'APPROVED', 'RESCHEDULE_PROPOSED', 'RESCHEDULE_ACCEPTED'];

export function isPublicAppointmentCancellable(status?: string) {
  return Boolean(status && cancellable.includes(status));
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not set';
}

interface AppointmentStatusCardProps {
  appointment: PublicAppointmentStatus;
  queuePosition?: QueuePosition;
  onCancel?: () => void;
  isCancelling?: boolean;
  onAcceptReschedule?: () => void;
  onRejectReschedule?: (reason?: string) => void;
  isUpdatingReschedule?: boolean;
}

export function AppointmentStatusCard({
  appointment,
  queuePosition,
  onCancel,
  isCancelling,
  onAcceptReschedule,
  onRejectReschedule,
  isUpdatingReschedule
}: AppointmentStatusCardProps) {
  const [rejectReason, setRejectReason] = useState('');
  const approved = appointment.status === 'APPROVED';
  const rescheduleProposed = appointment.status === 'RESCHEDULE_PROPOSED';
  const rescheduleAccepted = appointment.status === 'RESCHEDULE_ACCEPTED';
  const rescheduleRejected = appointment.status === 'RESCHEDULE_REJECTED';

  return (
    <Card className="grid gap-4">
      <div className="grid gap-1 text-center">
        <p className="text-sm text-slate-600">Appointment status</p>
        <div className="flex justify-center">
          <Badge>{getAppointmentStatusLabel(appointment.status)}</Badge>
        </div>
        <p className="text-2xl font-bold text-slate-950">{getAppointmentStatusLabel(appointment.status)}</p>
        <p className="text-sm text-slate-600">{appointment.message || getAppointmentStatusMessage(appointment.status)}</p>
      </div>

      {approved && appointment.queueNumber ? (
        <div className="rounded-md border border-teal-200 bg-teal-50 p-4 text-center">
          <p className="text-sm text-teal-700">Your queue number</p>
          <p className="text-5xl font-bold text-teal-950">{appointment.queueNumber}</p>
          <p className="mt-1 text-sm text-teal-800">Queue status: {queuePosition?.status ?? appointment.queueStatus ?? 'Assigned'}</p>
          {queuePosition ? (
            <p className="text-sm text-teal-800">
              Position: {queuePosition.position} - Now serving: {queuePosition.currentServingNumber ?? 'Not started'}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
        <p><span className="font-medium text-slate-950">Client:</span> {appointment.customerName}</p>
        <p><span className="font-medium text-slate-950">Service:</span> {appointment.serviceName}</p>
        <p><span className="font-medium text-slate-950">Branch:</span> {appointment.branchName ?? 'Any branch'}</p>
        <p><span className="font-medium text-slate-950">Requested:</span> {formatDateTime(appointment.requestedStartTime)} - {formatDateTime(appointment.requestedEndTime)}</p>
        <p><span className="font-medium text-slate-950">Approved:</span> {formatDateTime(appointment.approvedStartTime)} - {formatDateTime(appointment.approvedEndTime)}</p>
        <p><span className="font-medium text-slate-950">Queue number:</span> {appointment.queueNumber ?? 'Assigned after approval'}</p>
        {appointment.cancellationReason ? <p><span className="font-medium text-slate-950">Cancellation reason:</span> {appointment.cancellationReason}</p> : null}
        {appointment.rescheduleReason ? <p><span className="font-medium text-slate-950">Reschedule reason:</span> {appointment.rescheduleReason}</p> : null}
      </div>

      {rescheduleProposed ? (
        <div className="grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div>
            <p className="font-semibold">New appointment time proposed</p>
            <p>{formatDateTime(appointment.requestedStartTime)} - {formatDateTime(appointment.requestedEndTime)}</p>
            {appointment.rescheduleReason ? <p className="mt-1">Reason: {appointment.rescheduleReason}</p> : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button isLoading={isUpdatingReschedule} onClick={onAcceptReschedule} disabled={!onAcceptReschedule || isUpdatingReschedule}>Accept new time</Button>
            <Button variant="secondary" isLoading={isUpdatingReschedule} onClick={() => onRejectReschedule?.(rejectReason.trim() || undefined)} disabled={!onRejectReschedule || isUpdatingReschedule}>Reject new time</Button>
          </div>
          <label className="grid gap-1 text-xs text-amber-900">
            Optional rejection reason
            <textarea
              className="min-h-20 rounded-md border border-amber-200 bg-white p-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Add a short reason if you reject"
            />
          </label>
        </div>
      ) : null}

      {rescheduleAccepted ? (
        <div className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
          You accepted the new appointment time. Waiting for staff confirmation if required.
        </div>
      ) : null}

      {rescheduleRejected ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          You rejected the proposed new time. Please contact the business or wait for another update.
        </div>
      ) : null}

      {onCancel && isPublicAppointmentCancellable(appointment.status) ? (
        <Button variant="secondary" isLoading={isCancelling} onClick={onCancel}>Cancel appointment</Button>
      ) : null}
    </Card>
  );
}

