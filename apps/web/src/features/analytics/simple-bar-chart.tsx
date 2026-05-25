import { Card } from '@/components/ui/card';

export function SimpleBarChart({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return (
    <Card className="grid gap-3">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="grid gap-2">
        {entries.map(([label, value]) => (
          <div key={label} className="grid gap-1">
            <div className="flex justify-between text-xs text-slate-600"><span>{label}</span><span>{value}</span></div>
            <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-700" style={{ width: `${(value / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}
