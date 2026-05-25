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
import { Business } from '@/types/business-setup';
import { businessTypeOptions, languageOptions } from './business-options';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  businessType: z.enum(['MEDICAL_CENTER', 'DOCTOR', 'CLINIC', 'HOSPITAL', 'BARBER_SHOP', 'BEAUTY_PARLOUR', 'SALON', 'SERVICE_SHOP', 'OTHER']),
  defaultLanguage: z.enum(['en', 'si']),
  timezone: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
  isActive: z.boolean()
});

export type BusinessFormValues = z.infer<typeof schema>;

export function BusinessForm({ business, isSubmitting, onSubmit }: { business?: Business | null; isSubmitting?: boolean; onSubmit: (values: BusinessFormValues) => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BusinessFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      businessType: 'MEDICAL_CENTER',
      defaultLanguage: 'en',
      timezone: 'Asia/Colombo',
      phone: '',
      email: '',
      address: '',
      isActive: true
    }
  });

  useEffect(() => {
    if (business) {
      reset({
        name: business.name,
        slug: business.slug,
        businessType: business.businessType,
        defaultLanguage: business.defaultLanguage,
        timezone: business.timezone,
        phone: business.phone ?? '',
        email: business.email ?? '',
        address: business.address ?? '',
        isActive: business.isActive
      });
    }
  }, [business, reset]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Business name" error={errors.name?.message} {...register('name')} />
        <Input label="Slug" error={errors.slug?.message} {...register('slug')} />
        <Select label="Business type" options={businessTypeOptions} error={errors.businessType?.message} {...register('businessType')} />
        <Select label="Default language" options={languageOptions} error={errors.defaultLanguage?.message} {...register('defaultLanguage')} />
        <Input label="Timezone" error={errors.timezone?.message} {...register('timezone')} />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
        <Input label="Email" error={errors.email?.message} {...register('email')} />
      </div>
      <Textarea label="Address" error={errors.address?.message} {...register('address')} />
      <Checkbox label="Business is active" {...register('isActive')} />
      <Button type="submit" isLoading={isSubmitting}>{business ? 'Update business' : 'Create business'}</Button>
    </form>
  );
}
