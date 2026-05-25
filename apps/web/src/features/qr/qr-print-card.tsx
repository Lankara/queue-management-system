'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { PublicQrLinkOption } from '@/types/qr';

export function QrPrintCard({ businessName, option }: { businessName: string; option: PublicQrLinkOption }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(option.url, { width: 420, margin: 2, errorCorrectionLevel: 'M' }).then((url) => {
      if (mounted) setDataUrl(url);
    });
    return () => { mounted = false; };
  }, [option.url]);

  return (
    <div className="hidden print:grid print:min-h-screen print:place-items-center print:bg-white print:p-8">
      <div className="grid max-w-xl place-items-center gap-5 text-center text-slate-950">
        <h1 className="text-3xl font-bold">{businessName}</h1>
        <p className="text-xl font-semibold">{option.label}</p>
        {dataUrl ? <img alt="Printable queue QR code" className="h-80 w-80" src={dataUrl} /> : null}
        <div className="grid gap-1">
          <p className="text-2xl font-bold">Scan to join the queue</p>
          <p className="text-xl">පෝලිමට එකතු වීමට ස්කෑන් කරන්න</p>
        </div>
        <p className="break-all text-sm text-slate-600">{option.url}</p>
      </div>
    </div>
  );
}
