'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Branch, Service } from '@/types/business-setup';

const schema = z.object({
  branchId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  requiresApproval: z.boolean(),
  isActive: z.boolean()
});

export type ServiceFormValues = z.output<typeof schema>;
type ServiceFormInputValues = z.input<typeof schema>;

export function ServiceForm({ service, branches, lockedBranch, businessName, isSubmitting, onSubmit }: { service?: Service | null; branches: Branch[]; lockedBranch?: Branch | null; businessName?: string; isSubmitting?: boolean; onSubmit: (values: ServiceFormValues) => void }) {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ServiceFormInputValues, unknown, ServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { branchId: lockedBranch?.id ?? '', name: '', code: '', description: '', durationMinutes: 15, requiresApproval: true, isActive: true }
  });

  useEffect(() => {
    if (service) {
      reset({
        branchId: service.branchId ?? lockedBranch?.id ?? '',
        name: service.name,
        code: service.code,
        description: service.description ?? '',
        durationMinutes: service.durationMinutes,
        requiresApproval: service.requiresApproval,
        isActive: service.isActive
      });
      return;
    }
    if (lockedBranch) {
      setValue('branchId', lockedBranch.id);
    }
  }, [lockedBranch, service, reset, setValue]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit((values) => onSubmit({ ...values, branchId: lockedBranch?.id ?? (values.branchId || undefined) }))}>
      {lockedBranch ? (
        <div className="grid gap-2 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-950">
          <div><span className="font-semibold">Business:</span> {businessName ?? 'Selected business'}</div>
          <div><span className="font-semibold">Branch:</span> {lockedBranch.name}</div>
          <input type="hidden" {...register('branchId')} value={lockedBranch.id} />
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {!lockedBranch ? <Select label="Branch" placeholder="No branch" options={branches.map((branch) => ({ label: branch.name, value: branch.id }))} error={errors.branchId?.message} {...register('branchId')} /> : null}
        <Input label="Service name" error={errors.name?.message} {...register('name')} />
        <Input label="Code" error={errors.code?.message} {...register('code')} />
        <Input label="Duration minutes" type="number" min={1} error={errors.durationMinutes?.message} {...register('durationMinutes')} />
      </div>
      <Textarea label="Description" error={errors.description?.message} {...register('description')} />
      <div className="grid gap-3 md:grid-cols-2">
        <Checkbox label="Requires approval" {...register('requiresApproval')} />
        <Checkbox label="Service is active" {...register('isActive')} />
      </div>
      <Button type="submit" isLoading={isSubmitting}>{service ? 'Update service' : 'Create service'}</Button>
    </form>
  );
}