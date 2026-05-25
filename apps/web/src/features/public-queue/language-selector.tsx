'use client';

import { Button } from '@/components/ui/button';
import { LanguageCode } from '@/types/business-setup';

export function LanguageSelector({ value, onChange }: { value: LanguageCode; onChange: (language: LanguageCode) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button variant={value === 'en' ? 'primary' : 'secondary'} onClick={() => onChange('en')}>English</Button>
      <Button variant={value === 'si' ? 'primary' : 'secondary'} onClick={() => onChange('si')}>Sinhala</Button>
    </div>
  );
}
