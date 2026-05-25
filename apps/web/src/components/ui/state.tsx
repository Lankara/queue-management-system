import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Card } from './card';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <Card className="flex items-center gap-3 text-sm text-slate-600">
      <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
      {message}
    </Card>
  );
}

export function ErrorState({ message = 'Something went wrong.' }: { message?: string }) {
  return (
    <Card className="flex items-center gap-3 border-red-200 bg-red-50 text-sm text-red-700">
      <AlertCircle className="h-4 w-4" />
      {message}
    </Card>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="grid place-items-center gap-2 py-10 text-center">
      <Inbox className="h-8 w-8 text-slate-400" />
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description ? <p className="max-w-md text-sm text-slate-600">{description}</p> : null}
    </Card>
  );
}
