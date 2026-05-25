'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { BusinessProfileSettings } from '@/types/business-setup';
import { profileModeOptions } from '../businesses/business-options';

const schema = z.object({
  profileMode: z.enum(['BASIC', 'MEDICAL', 'CUSTOM']),
  requireCustomerName: z.boolean(),
  requireAge: z.boolean(),
  requireGender: z.boolean(),
  requireAddress: z.boolean(),
  requireMedicalHistory: z.boolean(),
  requireCurrentSymptoms: z.boolean(),
  allowLinkedClients: z.boolean(),
  allowOnlineBooking: z.boolean(),
  noShowBanLimit: z.coerce.number().min(0),
  queueNumberLength: z.coerce.number().min(1).max(6)
});

export type ProfileSettingsFormValues = z.output<typeof schema>;
type ProfileSettingsFormInputValues = z.input<typeof schema>;

export function ProfileSettingsForm({ settings, isSubmitting, onSubmit }: { settings: BusinessProfileSettings; isSubmitting?: boolean; onSubmit: (values: ProfileSettingsFormValues) => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileSettingsFormInputValues, unknown, ProfileSettingsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: settings
  });

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-3">
        <Select label="Profile mode" options={profileModeOptions} error={errors.profileMode?.message} {...register('profileMode')} />
        <Input label="No-show ban limit" type="number" min={0} error={errors.noShowBanLimit?.message} {...register('noShowBanLimit')} />
        <Input label="Queue number length" type="number" min={1} max={6} error={errors.queueNumberLength?.message} {...register('queueNumberLength')} />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Checkbox label="Require customer name" {...register('requireCustomerName')} />
        <Checkbox label="Require age" {...register('requireAge')} />
        <Checkbox label="Require gender" {...register('requireGender')} />
        <Checkbox label="Require address" {...register('requireAddress')} />
        <Checkbox label="Require medical history" {...register('requireMedicalHistory')} />
        <Checkbox label="Require current symptoms" {...register('requireCurrentSymptoms')} />
        <Checkbox label="Allow linked clients" {...register('allowLinkedClients')} />
        <Checkbox label="Allow online booking" {...register('allowOnlineBooking')} />
      </div>
      <Button type="submit" isLoading={isSubmitting}>Update settings</Button>
    </form>
  );
}


