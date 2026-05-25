import { HTMLAttributes } from 'react';
import clsx from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'green' | 'red' | 'slate' | 'teal';
}

export function Badge({ tone = 'slate', className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
        tone === 'green' && 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        tone === 'red' && 'bg-red-50 text-red-700 ring-1 ring-red-200',
        tone === 'teal' && 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
        tone === 'slate' && 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
        className
      )}
      {...props}
    />
  );
}
