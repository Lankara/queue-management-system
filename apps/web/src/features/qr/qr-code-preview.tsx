'use client';

import QRCode from 'qrcode';
import { Download, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/state';

export function QrCodePreview({ value, filename }: { value: string; filename: string }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(value, { width: 320, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0f172a', light: '#ffffff' } })
      .then((url) => { if (mounted) setDataUrl(url); })
      .catch(() => { if (mounted) setDataUrl(''); });
    return () => { mounted = false; };
  }, [value]);

  function downloadPng() {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  function printPage() {
    window.print();
  }

  return (
    <Card className="grid gap-4">
      <div className="grid place-items-center rounded-md border border-slate-200 bg-white p-4">
        {dataUrl ? <img alt="Queue QR code" className="h-64 w-64" src={dataUrl} /> : <LoadingState message="Generating QR code..." />}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button onClick={downloadPng} disabled={!dataUrl}><Download className="h-4 w-4" /> Download PNG</Button>
        <Button variant="secondary" onClick={printPage}><Printer className="h-4 w-4" /> Print</Button>
      </div>
    </Card>
  );
}
