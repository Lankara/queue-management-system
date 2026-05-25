'use client';

import { Badge } from '@/components/ui/badge';
import { PublicQrLinkOption } from '@/types/qr';

export function QrOptionSelector({ options, selectedUrl, onSelect }: { options: PublicQrLinkOption[]; selectedUrl: string; onSelect: (option: PublicQrLinkOption) => void }) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <button
          key={option.url}
          type="button"
          onClick={() => onSelect(option)}
          className={`rounded-md border bg-white p-4 text-left transition ${selectedUrl === option.url ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-slate-950">{option.label}</p>
            <Badge tone={option.type === 'business' ? 'teal' : 'slate'}>{option.type.replace('-', ' + ')}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{option.description}</p>
        </button>
      ))}
    </div>
  );
}
