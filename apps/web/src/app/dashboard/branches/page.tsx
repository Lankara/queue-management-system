'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { BranchForm, BranchFormValues } from '@/features/branches/branch-form';
import { createBranch, listBranches, updateBranch } from '@/features/branches/branches.api';
import { useBusinessStore } from '@/store/business-store';
import { Branch } from '@/types/business-setup';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((state) => state.selectedBusinessId);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const branchesQuery = useQuery({ queryKey: ['branches', businessId], queryFn: () => listBranches(businessId as string), enabled: Boolean(businessId) });
  const saveMutation = useMutation({
    mutationFn: (values: BranchFormValues) => editingBranch ? updateBranch(businessId as string, editingBranch.id, values) : createBranch(businessId as string, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', businessId] });
      setEditingBranch(null);
      setMessage('Branch saved.');
    }
  });

  if (!businessId) {
    return <div className="grid gap-6"><PageHeader title="Branches" description="Manage branch records for the selected business." /><BusinessSelector /><EmptyState title="Select or create a business first" /></div>;
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Branches" description="Manage branch records for the selected business." />
      <BusinessSelector />
      {message ? <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{message}</Card> : null}
      {saveMutation.error ? <ErrorState message={getErrorMessage(saveMutation.error)} /> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-3">
          {branchesQuery.isLoading ? <LoadingState message="Loading branches..." /> : null}
          {branchesQuery.error ? <ErrorState message={getErrorMessage(branchesQuery.error)} /> : null}
          {branchesQuery.data?.length === 0 ? <EmptyState title="No branches yet" /> : null}
          {branchesQuery.data?.map((branch) => (
            <Card key={branch.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div><div className="flex items-center gap-2"><h2 className="font-semibold">{branch.name}</h2><Badge tone={branch.isActive ? 'green' : 'red'}>{branch.isActive ? 'Active' : 'Inactive'}</Badge></div><p className="mt-2 text-sm text-slate-600">{branch.code} · {branch.phone ?? 'No phone'}</p><p className="mt-1 text-sm text-slate-500">{branch.address ?? 'No address'}</p></div>
                <Button variant="ghost" onClick={() => setEditingBranch(branch)}><Pencil className="h-4 w-4" />Edit</Button>
              </div>
            </Card>
          ))}
        </div>
        <Card><h2 className="mb-4 text-base font-semibold">{editingBranch ? 'Edit branch' : 'Create branch'}</h2><BranchForm branch={editingBranch} isSubmitting={saveMutation.isPending} onSubmit={(values) => saveMutation.mutate(values)} /></Card>
      </div>
    </div>
  );
}
