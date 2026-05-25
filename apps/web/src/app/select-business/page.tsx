'use client';

import { Building2, Plus, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';
import { useAuthStore } from '@/store/auth-store';
import { useBusinessStore } from '@/store/business-store';

function formatBusinessType(value?: string | null) {
  return value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : 'Business';
}

export default function SelectBusinessPage() {
  const router = useRouter();
  const { accessToken } = useAuthRedirect(true);
  const user = useAuthStore((state) => state.user);
  const setSelectedBusiness = useBusinessStore((state) => state.setSelectedBusiness);
  const businesses = user?.businesses ?? [];

  if (!accessToken) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700"><Store className="h-4 w-4" /> Queue Management System</Link>
            <h1 className="text-3xl font-semibold text-slate-950">Select a business</h1>
            <p className="mt-2 text-sm text-slate-600">Choose the business portal you want to operate. Tenant data remains separated by business.</p>
          </div>
          <Button variant="secondary" onClick={() => router.replace('/login')}>Back to login</Button>
        </div>

        {businesses.length === 0 ? (
          <Card className="grid gap-4 text-center">
            <Building2 className="mx-auto h-10 w-10 text-teal-700" />
            <h2 className="text-xl font-semibold text-slate-950">Create your first business</h2>
            <p className="mx-auto max-w-md text-sm text-slate-600">Your account is not linked to a business yet. Register a business to start using the dashboard.</p>
            <Link className="mx-auto inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white" href="/register"><Plus className="h-4 w-4" /> Create business</Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {businesses.map((business) => (
              <button
                key={`${business.businessId}-${business.role}`}
                type="button"
                onClick={() => {
                  setSelectedBusiness(business.businessId, business.businessName, business.businessType ?? null, business.role);
                  router.replace('/dashboard');
                }}
                className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-teal-600 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{business.businessName ?? 'Unnamed business'}</h2>
                    <p className="mt-1 text-sm text-slate-600">{formatBusinessType(business.businessType)}</p>
                  </div>
                  <Badge tone={business.isActive === false ? 'slate' : 'green'}>{business.isActive === false ? 'Inactive' : 'Active'}</Badge>
                </div>
                <p className="mt-4 text-sm font-medium text-teal-700">Role: {business.role.replaceAll('_', ' ')}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

