import { ReactNode } from 'react';

export function PublicLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto grid w-full max-w-xl gap-5">
        <header className="rounded-md bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-medium text-teal-700">Queue Management</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </main>
  );
}
