'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const genderOptions = [{ label: 'Not specified', value: 'NOT_SPECIFIED' }, { label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }, { label: 'Other', value: 'OTHER' }];
const schema = z.object({ fullName: z.string().min(1, 'Name is required'), relationshipToContact: z.string().optional(), gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED']), ageYears: z.coerce.number().min(0).optional().or(z.literal('')) });
export type PublicClientProfileFormValues = z.input<typeof schema>;

export function PublicClientProfileForm({ isLoading, onSubmit }: { isLoading?: boolean; onSubmit: (values: PublicClientProfileFormValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PublicClientProfileFormValues>({ resolver: zodResolver(schema), defaultValues: { fullName: '', relationshipToContact: '', gender: 'NOT_SPECIFIED', ageYears: '' } });
  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <Input label="Client / patient name" error={errors.fullName?.message} {...register('fullName')} />
      <Input label="Relationship" error={errors.relationshipToContact?.message} {...register('relationshipToContact')} />
      <Select label="Gender" options={genderOptions} error={errors.gender?.message} {...register('gender')} />
      <Input label="Age" type="number" min={0} error={errors.ageYears?.message} {...register('ageYears')} />
      <Button type="submit" isLoading={isLoading}>Save profile</Button>
    </form>
  );
}
