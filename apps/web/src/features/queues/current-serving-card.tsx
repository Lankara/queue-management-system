import { Card } from '@/components/ui/card';

export function CurrentServingCard({ currentNumber }: { currentNumber?: string | null }) {
  return (
    <Card className="bg-slate-950 text-white">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Now Serving</p>
      <p className="mt-2 text-5xl font-bold">{currentNumber ?? '---'}</p>
    </Card>
  );
}
