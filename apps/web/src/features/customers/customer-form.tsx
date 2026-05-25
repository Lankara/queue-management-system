'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { languageOptions } from '@/features/businesses/business-options';
import { Customer } from '@/types/customer-profile';

const schema = z.object({
  primaryPhone: z.string().min(1, 'Phone is required'),
  preferredLanguage: z.enum(['en', 'si'])
});

export type CustomerFormValues = z.infer<typeof schema>;

export function CustomerForm({ customer, isSubmitting, onSubmit }: { customer?: Customer | null; isSubmitting?: boolean; onSubmit: (values: CustomerFormValues) => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { primaryPhone: '', preferredLanguage: 'en' }
  });

  useEffect(() => {
    if (customer) {
      reset({ primaryPhone: customer.primaryPhone, preferredLanguage: customer.preferredLanguage });
    }
  }, [customer, reset]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <Input label="Primary phone" error={errors.primaryPhone?.message} disabled={Boolean(customer)} {...register('primaryPhone')} />
      <Select label="Preferred language" options={languageOptions} error={errors.preferredLanguage?.message} {...register('preferredLanguage')} />
      <Button type="submit" isLoading={isSubmitting}>{customer ? 'Update customer' : 'Create customer'}</Button>
    </form>
  );
}
