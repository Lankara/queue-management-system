'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Branch } from '@/types/business-setup';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean()
});

export type BranchFormValues = z.infer<typeof schema>;

export function BranchForm({ branch, isSubmitting, onSubmit }: { branch?: Branch | null; isSubmitting?: boolean; onSubmit: (values: BranchFormValues) => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BranchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', code: '', address: '', phone: '', isActive: true }
  });

  useEffect(() => {
    if (branch) {
      reset({ name: branch.name, code: branch.code, address: branch.address ?? '', phone: branch.phone ?? '', isActive: branch.isActive });
    }
  }, [branch, reset]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Branch name" error={errors.name?.message} {...register('name')} />
        <Input label="Code" error={errors.code?.message} {...register('code')} />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
      </div>
      <Textarea label="Address" error={errors.address?.message} {...register('address')} />
      <Checkbox label="Branch is active" {...register('isActive')} />
      <Button type="submit" isLoading={isSubmitting}>{branch ? 'Update branch' : 'Create branch'}</Button>
    </form>
  );
}
