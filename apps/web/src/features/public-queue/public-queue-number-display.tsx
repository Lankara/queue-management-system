import { Card } from '@/components/ui/card';

export function PublicQueueNumberDisplay({ label, value }: { label: string; value?: string | number | null }) {
  return <Card className="bg-slate-950 text-center text-white"><p className="text-xs font-semibold uppercase text-slate-300">{label}</p><p className="mt-2 text-5xl font-bold">{value ?? '---'}</p></Card>;
}
