'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  newStartTime: z.string().min(1, 'New start time is required'),
  newEndTime: z.string().min(1, 'New end time is required'),
  reason: z.string().optional()
});

export type RescheduleFormValues = z.infer<typeof schema>;

export function RescheduleForm({ isSubmitting, onSubmit }: { isSubmitting?: boolean; onSubmit: (values: RescheduleFormValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<RescheduleFormValues>({ resolver: zodResolver(schema), defaultValues: { newStartTime: '', newEndTime: '', reason: '' } });
  return (
    <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="New start time" type="datetime-local" error={errors.newStartTime?.message} {...register('newStartTime')} />
        <Input label="New end time" type="datetime-local" error={errors.newEndTime?.message} {...register('newEndTime')} />
      </div>
      <Textarea label="Reason" error={errors.reason?.message} {...register('reason')} />
      <Button type="submit" isLoading={isSubmitting}>Propose reschedule</Button>
    </form>
  );
}
