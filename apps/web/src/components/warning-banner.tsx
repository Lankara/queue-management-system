import { AlertTriangle } from 'lucide-react';
import { ReactNode } from 'react';

export function WarningBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
