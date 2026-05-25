'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ClientProfile } from '@/types/customer-profile';

const genderOptions = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
  { label: 'Not specified', value: 'NOT_SPECIFIED' }
];

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  relationshipToContact: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED']),
  dateOfBirth: z.string().optional(),
  ageYears: z.coerce.number().min(0).optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional()
});

export type ClientProfileFormValues = Omit<z.output<typeof schema>, 'ageYears'> & { ageYears?: number };
type ClientProfileFormInputValues = z.input<typeof schema>;

export function ClientProfileForm({ profile, isSubmitting, onSubmit }: { profile?: ClientProfile | null; isSubmitting?: boolean; onSubmit: (values: ClientProfileFormValues) => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientProfileFormInputValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', relationshipToContact: '', gender: 'NOT_SPECIFIED', dateOfBirth: '', ageYears: '', address: '', notes: '' }
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        relationshipToContact: profile.relationshipToContact ?? '',
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth ?? '',
        ageYears: profile.ageYears ?? '',
        address: profile.address ?? '',
        notes: profile.notes ?? ''
      });
    }
  }, [profile, reset]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit((values) => onSubmit({ ...values, ageYears: values.ageYears === '' ? undefined : Number(values.ageYears) }))}>
      <Input label="Full name" error={errors.fullName?.message} {...register('fullName')} />
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Relationship to contact" error={errors.relationshipToContact?.message} {...register('relationshipToContact')} />
        <Select label="Gender" options={genderOptions} error={errors.gender?.message} {...register('gender')} />
        <Input label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
        <Input label="Age years" type="number" min={0} error={errors.ageYears?.message} {...register('ageYears')} />
      </div>
      <Textarea label="Address" error={errors.address?.message} {...register('address')} />
      <Textarea label="Notes" error={errors.notes?.message} {...register('notes')} />
      <Button type="submit" isLoading={isSubmitting}>{profile ? 'Update profile' : 'Create profile'}</Button>
    </form>
  );
}
