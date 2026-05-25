'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({ phone: z.string().min(7, 'Enter a valid phone number') });
export type PhoneLookupValues = z.infer<typeof schema>;

export function PhoneLookupForm({ isLoading, onSubmit }: { isLoading?: boolean; onSubmit: (values: PhoneLookupValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PhoneLookupValues>({ resolver: zodResolver(schema), defaultValues: { phone: '' } });
  return <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}><Input label="Phone number" inputMode="tel" error={errors.phone?.message} {...register('phone')} /><Button type="submit" isLoading={isLoading}>Continue</Button></form>;
}
