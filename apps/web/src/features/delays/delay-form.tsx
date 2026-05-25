'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Branch, Service } from '@/types/business-setup';

const schema = z.object({
  branchId: z.string().optional(),
  serviceId: z.string().min(1, 'Service is required'),
  delayMinutes: z.coerce.number().min(1, 'Delay must be at least 1 minute'),
  affectedFromTime: z.string().min(1, 'Affected from time is required'),
  reason: z.string().optional()
});

export type DelayFormValues = z.output<typeof schema>;
type DelayFormInputValues = z.input<typeof schema>;

export function DelayForm({ branches, services, isSubmitting, onSubmit }: { branches: Branch[]; services: Service[]; isSubmitting?: boolean; onSubmit: (values: DelayFormValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<DelayFormInputValues, unknown, DelayFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { branchId: '', serviceId: '', delayMinutes: 15, affectedFromTime: '', reason: '' }
  });
  return (
    <form className="grid gap-4" onSubmit={handleSubmit((values) => onSubmit({ ...values, branchId: values.branchId || undefined }))}>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Branch" placeholder="All branches" options={branches.map((branch) => ({ label: branch.name, value: branch.id }))} error={errors.branchId?.message} {...register('branchId')} />
        <Select label="Service" placeholder="Select service" options={services.map((service) => ({ label: service.name, value: service.id }))} error={errors.serviceId?.message} {...register('serviceId')} />
        <Input label="Delay minutes" type="number" min={1} error={errors.delayMinutes?.message} {...register('delayMinutes')} />
        <Input label="Affected from" type="datetime-local" error={errors.affectedFromTime?.message} {...register('affectedFromTime')} />
      </div>
      <Textarea label="Reason" error={errors.reason?.message} {...register('reason')} />
      <Button type="submit" isLoading={isSubmitting}>Create delay event</Button>
    </form>
  );
}
