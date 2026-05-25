import { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export function Checkbox({ label, description, ...props }: CheckboxProps) {
  return (
    <label className="flex gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800">
      <input className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700" type="checkbox" {...props} />
      <span className="grid gap-0.5">
        <span className="font-medium">{label}</span>
        {description ? <span className="text-xs text-slate-500">{description}</span> : null}
      </span>
    </label>
  );
}
