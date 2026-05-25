'use client';

import { useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { listBranches } from '@/features/branches/branches.api';
import { getBusiness } from '@/features/businesses/businesses.api';
import { buildQrLinkOptions, getPublicAppUrl } from '@/features/qr/qr-link-builder';
import { QrCodePreview } from '@/features/qr/qr-code-preview';
import { QrOptionSelector } from '@/features/qr/qr-option-selector';
import { QrPrintCard } from '@/features/qr/qr-print-card';
import { listServices } from '@/features/services/services.api';
import { useBusinessStore } from '@/store/business-store';
import { PublicQrLinkOption } from '@/types/qr';

export default function QrManagementPage() {
  const selectedBusinessId = useBusinessStore((state) => state.selectedBusinessId);
  const [selectedOptionUrl, setSelectedOptionUrl] = useState<string>('');
  const [copyMessage, setCopyMessage] = useState<string>('');
  const publicAppUrl = getPublicAppUrl();

  const businessQuery = useQuery({ queryKey: ['business', selectedBusinessId], queryFn: () => getBusiness(selectedBusinessId as string), enabled: Boolean(selectedBusinessId) });
  const branchesQuery = useQuery({ queryKey: ['branches', selectedBusinessId], queryFn: () => listBranches(selectedBusinessId as string), enabled: Boolean(selectedBusinessId) });
  const servicesQuery = useQuery({ queryKey: ['services', selectedBusinessId], queryFn: () => listServices(selectedBusinessId as string), enabled: Boolean(selectedBusinessId) });

  const options = useMemo(() => {
    if (!businessQuery.data) return [];
    return buildQrLinkOptions(businessQuery.data, branchesQuery.data ?? [], servicesQuery.data ?? [], publicAppUrl);
  }, [branchesQuery.data, businessQuery.data, publicAppUrl, servicesQuery.data]);

  const selectedOption: PublicQrLinkOption | undefined = options.find((option) => option.url === selectedOptionUrl) ?? options[0];

  async function copyLink() {
    if (!selectedOption) return;
    await navigator.clipboard.writeText(selectedOption.url);
    setCopyMessage('Copied public queue link');
    window.setTimeout(() => setCopyMessage(''), 2500);
  }

  if (!selectedBusinessId) {
    return <EmptyState title="Select a business first" description="Choose or create a business before generating public queue QR codes." />;
  }

  if (businessQuery.isLoading || branchesQuery.isLoading || servicesQuery.isLoading) {
    return <LoadingState message="Loading QR link data..." />;
  }

  if (businessQuery.error || branchesQuery.error || servicesQuery.error) {
    return <ErrorState message="Could not load QR link data." />;
  }

  if (!businessQuery.data?.slug) {
    return <ErrorState message="This business needs a slug before public QR links can be generated." />;
  }

  return (
    <>
      <div className="grid gap-6 print:hidden">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">QR Codes</h1>
            <p className="text-sm text-slate-600">Generate public queue links for {businessQuery.data.name}.</p>
          </div>
          <Button variant="secondary" onClick={copyLink} disabled={!selectedOption}><Copy className="h-4 w-4" /> Copy Link</Button>
        </div>

        {copyMessage ? <Card className="border-teal-200 bg-teal-50 text-sm text-teal-800">{copyMessage}</Card> : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="grid gap-6">
            <Card className="grid gap-3">
              <div className="flex items-center gap-2 text-slate-950"><QrCode className="h-5 w-5 text-teal-700" /><h2 className="font-semibold">Selected public link</h2></div>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700 break-all">{selectedOption?.url}</div>
              {selectedOption ? <Link className="inline-flex items-center gap-2 text-sm font-medium text-teal-700" href={selectedOption.url} target="_blank"><ExternalLink className="h-4 w-4" /> Open public link</Link> : null}
              <p className="text-xs text-slate-500">Branch and service query parameters are future-ready. The current public flow may not prefill them until query-param support is added there.</p>
            </Card>

            <div>
              <h2 className="mb-3 font-semibold text-slate-950">Business, branch, and service links</h2>
              <QrOptionSelector options={options} selectedUrl={selectedOption?.url ?? ''} onSelect={(option) => setSelectedOptionUrl(option.url)} />
            </div>
          </div>

          <div className="grid gap-6">
            {selectedOption ? <QrCodePreview value={selectedOption.url} filename={selectedOption.filename} /> : null}
            <Card className="grid gap-2 text-sm text-slate-600">
              <p className="font-medium text-slate-950">Print card includes</p>
              <p>Business name, QR code, selected branch/service label, English instruction, Sinhala instruction, and the public URL.</p>
            </Card>
          </div>
        </div>
      </div>
      {selectedOption ? <QrPrintCard businessName={businessQuery.data.name} option={selectedOption} /> : null}
    </>
  );
}

