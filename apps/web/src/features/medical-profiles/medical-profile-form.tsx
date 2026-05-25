'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MedicalProfile } from '@/types/customer-profile';

const schema = z.object({
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  currentSymptoms: z.string().optional(),
  previousVisitNotes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional()
});

export type MedicalProfileFormValues = z.infer<typeof schema>;

export function MedicalProfileForm({ profile, isSubmitting, onSubmit }: { profile?: MedicalProfile | null; isSubmitting?: boolean; onSubmit: (values: MedicalProfileFormValues) => void }) {
  const { register, handleSubmit, reset } = useForm<MedicalProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { bloodGroup: '', allergies: '', medicalHistory: '', currentSymptoms: '', previousVisitNotes: '', emergencyContactName: '', emergencyContactPhone: '' }
  });

  useEffect(() => {
    if (profile) {
      reset({
        bloodGroup: profile.bloodGroup ?? '',
        allergies: profile.allergies ?? '',
        medicalHistory: profile.medicalHistory ?? '',
        currentSymptoms: profile.currentSymptoms ?? '',
        previousVisitNotes: profile.previousVisitNotes ?? '',
        emergencyContactName: profile.emergencyContactName ?? '',
        emergencyContactPhone: profile.emergencyContactPhone ?? ''
      });
    }
  }, [profile, reset]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Blood group" {...register('bloodGroup')} />
        <Input label="Emergency contact name" {...register('emergencyContactName')} />
        <Input label="Emergency contact phone" {...register('emergencyContactPhone')} />
      </div>
      <Textarea label="Allergies" {...register('allergies')} />
      <Textarea label="Medical history" {...register('medicalHistory')} />
      <Textarea label="Current symptoms" {...register('currentSymptoms')} />
      <Textarea label="Previous visit notes" {...register('previousVisitNotes')} />
      <Button type="submit" isLoading={isSubmitting}>{profile ? 'Update medical profile' : 'Create medical profile'}</Button>
    </form>
  );
}
