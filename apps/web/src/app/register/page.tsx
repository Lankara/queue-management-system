'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ArrowRight, Building2, Lock, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { routeAfterAuth } from '@/features/auth/session-routing';
import { registerOwnerBusiness } from '@/lib/auth';
import { useAuthStore } from '@/store/auth-store';
import { useBusinessStore } from '@/store/business-store';

const businessTypeOptions = [
  { label: 'Medical Center', value: 'MEDICAL_CENTER' },
  { label: 'Doctor / Channeling Center', value: 'DOCTOR' },
  { label: 'Clinic', value: 'CLINIC' },
  { label: 'Hospital', value: 'HOSPITAL' },
  { label: 'Barber Shop', value: 'BARBER_SHOP' },
  { label: 'Beauty Parlour', value: 'BEAUTY_PARLOUR' },
  { label: 'Salon', value: 'SALON' },
  { label: 'Service Shop', value: 'SERVICE_SHOP' },
  { label: 'Other', value: 'OTHER' }
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Sinhala', value: 'si' }
];

const schema = z.object({
  fullName: z.string().min(2, 'Owner name is required'),
  email: z.string().email('Valid owner email is required'),
  phone: z.string().min(7, 'Owner phone is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm your password'),
  preferredLanguage: z.enum(['en', 'si']),
  businessName: z.string().min(2, 'Business name is required'),

  businessType: z.enum(['MEDICAL_CENTER', 'DOCTOR', 'CLINIC', 'HOSPITAL', 'BARBER_SHOP', 'BEAUTY_PARLOUR', 'SALON', 'SERVICE_SHOP', 'OTHER']),
  defaultLanguage: z.enum(['en', 'si']),
  timezone: z.string().min(1, 'Timezone is required'),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email('Use a valid business email').optional().or(z.literal('')),
  address: z.string().optional(),
  branchName: z.string().optional(),
  branchCode: z.string().optional(),
  serviceName: z.string().optional(),
  serviceCode: z.string().optional(),
  durationMinutes: z.number().min(1).max(480).optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type FormValues = z.infer<typeof schema>;

function createSlugPreview(value?: string) {
  const base = value?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 18).replace(/-+$/g, '');
  return `${base || 'business'}-####`;
}

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setSelectedBusiness = useBusinessStore((state) => state.setSelectedBusiness);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      preferredLanguage: 'en',
      defaultLanguage: 'en',
      timezone: 'Asia/Colombo',
      businessType: 'MEDICAL_CENTER',
      durationMinutes: 15
    }
  });

  const businessName = watch('businessName');
  const slugPreview = createSlugPreview(businessName);

  const mutation = useMutation({
    mutationFn: registerOwnerBusiness,
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
      routeAfterAuth(data, router, setSelectedBusiness);
    }
  });

  function onSubmit(data: FormValues) {
    const { confirmPassword: _confirmPassword, businessEmail, ...values } = data;
    mutation.mutate({ ...values, businessEmail: businessEmail || undefined });
  }

  const errorMessage = mutation.error instanceof AxiosError
    ? mutation.error.response?.data?.error?.message ?? mutation.error.response?.data?.message ?? 'Registration failed'
    : mutation.error ? 'Registration failed' : null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700"><Store className="h-4 w-4" /> Queue Management System</Link>
            <h1 className="text-3xl font-semibold text-slate-950">Register your business</h1>
            <p className="mt-2 text-sm text-slate-600">Create an owner account, business portal, and optional first branch/service.</p>
          </div>
          <Link className="text-sm font-semibold text-teal-700" href="/login">Already have an account?</Link>
        </div>

        <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <div className="mb-4 flex items-center gap-2"><Building2 className="h-5 w-5 text-teal-700" /><h2 className="text-lg font-semibold text-slate-950">Step 1: Owner account</h2></div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Full name" error={errors.fullName?.message} {...register('fullName')} />
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
              <Select label="Preferred language" options={languageOptions} error={errors.preferredLanguage?.message} {...register('preferredLanguage')} />
              <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
              <Input label="Confirm password" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Step 2: Business setup</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Business name" error={errors.businessName?.message} {...register('businessName')} />
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Lock className="h-3.5 w-3.5" /> Public slug</div>
                <div className="font-mono text-sm font-semibold text-slate-800">{slugPreview}</div>
                <p className="mt-1 text-xs text-slate-500">Generated and locked by the system after registration.</p>
              </div>
              <Select label="Business type" options={businessTypeOptions} error={errors.businessType?.message} {...register('businessType')} />
              <Select label="Default language" options={languageOptions} error={errors.defaultLanguage?.message} {...register('defaultLanguage')} />
              <Input label="Timezone" error={errors.timezone?.message} {...register('timezone')} />
              <Input label="Business phone" error={errors.businessPhone?.message} {...register('businessPhone')} />
              <Input label="Business email" type="email" error={errors.businessEmail?.message} {...register('businessEmail')} />
              <Textarea label="Address" error={errors.address?.message} {...register('address')} />
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Step 3: First branch/service</h2>
            <p className="mb-4 text-sm text-slate-600">Optional, but useful for testing queues and appointments immediately.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Branch name" placeholder="Main Branch" error={errors.branchName?.message} {...register('branchName')} />
              <Input label="Branch code" placeholder="MAIN" error={errors.branchCode?.message} {...register('branchCode')} />
              <Input label="Service name" placeholder="General Service" error={errors.serviceName?.message} {...register('serviceName')} />
              <Input label="Service code" placeholder="GEN" error={errors.serviceCode?.message} {...register('serviceCode')} />
              <Input label="Duration minutes" type="number" error={errors.durationMinutes?.message} {...register('durationMinutes', { valueAsNumber: true })} />
            </div>
          </Card>

          {errorMessage ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{String(errorMessage)}</div> : null}
          <div className="flex justify-end">
            <Button type="submit" isLoading={mutation.isPending}>Create business portal <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </form>
      </div>
    </main>
  );
}
