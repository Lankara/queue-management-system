'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ArrowRight, LockKeyhole, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';
import { login } from '@/lib/auth';
import { routeAfterAuth } from '@/features/auth/session-routing';
import { useAuthStore } from '@/store/auth-store';
import { useBusinessStore } from '@/store/business-store';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  useAuthRedirect(false);
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setSelectedBusiness = useBusinessStore((state) => state.setSelectedBusiness);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: ''
    }
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
      routeAfterAuth(data, router, setSelectedBusiness);
    }
  });

  const errorMessage =
    mutation.error instanceof AxiosError
      ? mutation.error.response?.data?.error?.message ?? mutation.error.response?.data?.message ?? 'Login failed'
      : mutation.error
        ? 'Login failed'
        : null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="grid gap-6">
          <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-teal-200">
            <Store className="h-5 w-5" /> Queue Management System
          </Link>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">Sign in to your business portal</h1>
            <p className="mt-4 text-base leading-7 text-slate-300">One account can manage one or many businesses. Your dashboard opens only the business spaces connected to your user role.</p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Medical centers and channeling</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Barber, salon, and beauty queues</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">QR, appointment, and WhatsApp flows</div>
          </div>
        </section>

        <Card className="bg-white text-slate-950">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-700 text-white">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Login</h2>
              <p className="text-sm text-slate-600">Use your email or phone number</p>
            </div>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <Input label="Email or phone" autoComplete="username" error={errors.identifier?.message} {...register('identifier')} />
            <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
            {errorMessage ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{String(errorMessage)}</div> : null}
            <Button type="submit" isLoading={mutation.isPending}>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
            New business? <Link className="font-semibold text-teal-700" href="/register">Register your business</Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
