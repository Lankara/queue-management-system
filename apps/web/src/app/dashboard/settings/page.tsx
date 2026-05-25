'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { ProfileSettingsForm, ProfileSettingsFormValues } from '@/features/business-profile-settings/profile-settings-form';
import { getBusinessProfileSettings, updateBusinessProfileSettings } from '@/features/business-profile-settings/business-profile-settings.api';
import { useBusinessStore } from '@/store/business-store';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((state) => state.selectedBusinessId);
  const [message, setMessage] = useState<string | null>(null);
  const settingsQuery = useQuery({ queryKey: ['business-profile-settings', businessId], queryFn: () => getBusinessProfileSettings(businessId as string), enabled: Boolean(businessId) });
  const mutation = useMutation({
    mutationFn: (values: ProfileSettingsFormValues) => updateBusinessProfileSettings(businessId as string, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-profile-settings', businessId] });
      setMessage('Settings updated.');
    }
  });

  if (!businessId) {
    return <div className="grid gap-6"><PageHeader title="Settings" description="Configure profile and booking rules." /><BusinessSelector /><EmptyState title="Select or create a business first" /></div>;
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Settings" description="Configure profile and booking rules for the selected business." />
      <BusinessSelector />
      {message ? <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{message}</Card> : null}
      {settingsQuery.isLoading ? <LoadingState message="Loading profile settings..." /> : null}
      {settingsQuery.error ? <ErrorState message={getErrorMessage(settingsQuery.error)} /> : null}
      {mutation.error ? <ErrorState message={getErrorMessage(mutation.error)} /> : null}
      {settingsQuery.data ? <Card><ProfileSettingsForm settings={settingsQuery.data} isSubmitting={mutation.isPending} onSubmit={(values) => mutation.mutate(values)} /></Card> : null}
    </div>
  );
}
