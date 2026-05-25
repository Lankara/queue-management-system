'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';

export function AuthenticatedShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { accessToken } = useAuthRedirect(true);

  if (!accessToken) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {sidebarOpen ? <button className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" /> : null}
      <Sidebar open={sidebarOpen} />
      <div className="min-w-0 flex-1">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
