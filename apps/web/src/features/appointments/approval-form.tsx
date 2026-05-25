'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  approvedStartTime: z.string().optional(),
  approvedEndTime: z.string().optional()
});

export type ApprovalFormValues = z.infer<typeof schema>;

export function ApprovalForm({ isSubmitting, requestedStartTime, requestedEndTime, onSubmit }: { isSubmitting?: boolean; requestedStartTime?: string | null; requestedEndTime?: string | null; onSubmit: (values: ApprovalFormValues) => void }) {
  const { register, handleSubmit, watch } = useForm<ApprovalFormValues>({ resolver: zodResolver(schema), defaultValues: { approvedStartTime: '', approvedEndTime: '' } });
  const approvedStart = watch('approvedStartTime');
  const approvedEnd = watch('approvedEndTime');
  const start = approvedStart || requestedStartTime;
  const end = approvedEnd || requestedEndTime;
  const duration = start && end ? Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)) : null;
  return (
    <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <Input label="Approved start override" type="datetime-local" {...register('approvedStartTime')} />
        <Input label="Approved end override" type="datetime-local" {...register('approvedEndTime')} />
        <Button className="self-end" type="submit" isLoading={isSubmitting}>Approve</Button>
      </div>
      <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
        <p>{approvedStart || approvedEnd ? 'Approval will use the adjusted time.' : 'Approval will keep the requested time.'}</p>
        <p>Estimated duration: {duration ?? 'Not set'} minutes. Approval creates a confirmed queue entry and queue number.</p>
      </div>
    </form>
  );
}
