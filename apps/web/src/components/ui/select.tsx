import { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-800" htmlFor={selectId}>
      <span>{label}</span>
      <select
        id={selectId}
        className={clsx(
          'h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15',
          error && 'border-red-500 focus:border-red-600 focus:ring-red-600/15',
          className
        )}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  );
}
