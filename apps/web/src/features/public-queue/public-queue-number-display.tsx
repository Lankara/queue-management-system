import { Card } from '@/components/ui/card';

export function PublicQueueNumberDisplay({
  label,
  value,
  variant = 'default',
  emphasis = false,
  attention = false
}: {
  label: string;
  value?: string | number | null;
  variant?: 'default' | 'hot' | 'current' | 'served';
  emphasis?: boolean;
  attention?: boolean;
}) {
  const isHot = variant === 'hot';
  const isServed = variant === 'served';
  const isCurrent = variant === 'current';
  const animated = attention || isHot || isServed;
  const hasValue = value !== null && value !== undefined && value !== '';
  const displayValue = hasValue ? value : 'Pending';
  const cardClass = isServed
    ? 'border-red-300 bg-gradient-to-br from-red-700 via-red-500 to-orange-400 text-white shadow-xl shadow-red-300/50'
    : isHot
      ? 'border-orange-300 bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-300 text-white shadow-lg shadow-orange-300/40'
      : isCurrent
        ? 'bg-slate-950 text-white'
        : 'bg-white text-slate-950';

  return (
    <Card className={`relative overflow-hidden text-center ${cardClass} ${emphasis ? 'p-6' : ''} ${animated ? 'animate-pulse ring-4 ring-orange-300/40' : ''}`}>
      {animated ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.45),transparent_28%),radial-gradient(circle_at_20%_90%,rgba(255,255,255,0.28),transparent_24%)]" /> : null}
      <div className="relative">
        <p className={`text-xs font-semibold uppercase ${isHot || isCurrent || isServed ? 'text-white/80' : 'text-slate-500'}`}>{label}</p>
        <p className={`${emphasis ? 'text-7xl' : 'text-5xl'} mt-2 font-black tracking-normal`}>{value ?? '---'}</p>
      </div>
    </Card>
  );
}
