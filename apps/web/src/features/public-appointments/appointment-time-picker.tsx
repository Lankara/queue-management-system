'use client';

import { Input } from '@/components/ui/input';

export function AppointmentTimePicker({ startTime, endTime, onStartTimeChange }: { startTime: string; endTime: string; onStartTimeChange: (value: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input label="Preferred start time" type="datetime-local" value={startTime} onChange={(event) => onStartTimeChange(event.target.value)} />
      <Input label="Estimated end time" type="datetime-local" value={endTime} readOnly />
    </div>
  );
}
