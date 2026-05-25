export function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs font-medium uppercase text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value ?? 'Not provided'}</dd>
    </div>
  );
}
