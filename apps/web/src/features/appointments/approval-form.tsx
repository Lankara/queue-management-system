'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  approvedStartTime: z.string().optional(),
  approvedEndTime: z.string().optional()
});

export type ApprovalFormValues = z.infer<typeof schema>;

function toLocalDatetimeInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function ApprovalForm({ isSubmitting, requestedStartTime, requestedEndTime, onSubmit }: { isSubmitting?: boolean; requestedStartTime?: string | null; requestedEndTime?: string | null; onSubmit: (values: ApprovalFormValues) => void }) {
  const requestedStartInput = toLocalDatetimeInput(requestedStartTime);
  const requestedEndInput = toLocalDatetimeInput(requestedEndTime);
  const { register, handleSubmit, watch, reset } = useForm<ApprovalFormValues>({ resolver: zodResolver(schema), defaultValues: { approvedStartTime: requestedStartInput, approvedEndTime: requestedEndInput } });

  useEffect(() => {
    reset({ approvedStartTime: requestedStartInput, approvedEndTime: requestedEndInput });
  }, [requestedEndInput, requestedStartInput, reset]);

  const approvedStart = watch('approvedStartTime');
  const approvedEnd = watch('approvedEndTime');
  const start = approvedStart || requestedStartInput;
  const end = approvedEnd || requestedEndInput;
  const duration = start && end ? Math.max(0, Math.round((new Date(start).getTime() - new Date(end).getTime()) / -60000)) : null;
  return (
    <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <Input label="Approved start" type="datetime-local" {...register('approvedStartTime')} />
        <Input label="Approved end" type="datetime-local" {...register('approvedEndTime')} />
        <Button className="self-end" type="submit" isLoading={isSubmitting}>Approve</Button>
      </div>
      <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
        <p>Approval keeps the requested time unless the operator changes these fields.</p>
        <p>Estimated duration: {duration ?? 'Not set'} minutes. Approval creates a confirmed queue entry and queue number.</p>
      </div>
    </form>
  );
}
