import { TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-800" htmlFor={textareaId}>
      <span>{label}</span>
      <textarea
        id={textareaId}
        className={clsx(
          'min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15',
          error && 'border-red-500 focus:border-red-600 focus:ring-red-600/15',
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  );
}
