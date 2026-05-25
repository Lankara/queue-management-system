'use client';

import { LogOut, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useBusinessStore } from '@/store/business-store';

function formatLabel(value: string | null) {
  return value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : null;
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const selectedBusinessName = useBusinessStore((state) => state.selectedBusinessName);
  const selectedBusinessType = useBusinessStore((state) => state.selectedBusinessType);
  const selectedBusinessRole = useBusinessStore((state) => state.selectedBusinessRole);

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  const tenantDetails = [formatLabel(selectedBusinessType), formatLabel(selectedBusinessRole)].filter(Boolean).join(' • ');

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        aria-label="Open navigation"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 lg:hidden"
        onClick={onMenuClick}
        type="button"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-950">{selectedBusinessName ?? user?.fullName ?? 'Signed in user'}</p>
        <p className="truncate text-xs text-slate-500">{tenantDetails || user?.email || user?.phone || 'Authenticated session'}</p>
      </div>
      <Button variant="secondary" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </header>
  );
}