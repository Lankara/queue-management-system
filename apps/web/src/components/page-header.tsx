interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="grid gap-1">
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      {description ? <p className="text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}
