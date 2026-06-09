import { Card } from '@/components/ui/card';

export function CurrentServingCard({ currentNumber }: { currentNumber?: string | null }) {
  return (
    <Card className="relative overflow-hidden bg-slate-950 text-white shadow-[0_0_22px_rgba(245,158,11,0.45)] [animation:qms-now-serving-flare_1.8s_ease-out_1] before:absolute before:inset-x-0 before:bottom-0 before:h-8 before:bg-gradient-to-t before:from-amber-400/35 before:via-red-500/15 before:to-transparent before:content-['']">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Now Serving</p>
      <p className="mt-2 text-5xl font-bold">{currentNumber ?? '---'}</p>
    </Card>
  );
}
