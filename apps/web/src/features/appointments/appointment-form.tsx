'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Branch, Service } from '@/types/business-setup';
import { ClientProfile, Customer } from '@/types/customer-profile';
import { CustomerLookup } from '@/features/queues/customer-lookup';

const schema = z.object({
  branchId: z.string().optional(),
  serviceId: z.string().min(1, 'Service is required'),
  requestedStartTime: z.string().min(1, 'Start time is required'),
  requestedEndTime: z.string().min(1, 'End time is required')
});

export type AppointmentFormValues = z.infer<typeof schema>;

export function AppointmentForm({
  businessId,
  branches,
  services,
  selectedCustomer,
  selectedProfile,
  onCustomerSelect,
  onProfileSelect,
  isSubmitting,
  onSubmit
}: {
  businessId: string;
  branches: Branch[];
  services: Service[];
  selectedCustomer: Customer | null;
  selectedProfile: ClientProfile | null;
  onCustomerSelect: (customer: Customer) => void;
  onProfileSelect: (profile: ClientProfile) => void;
  isSubmitting?: boolean;
  onSubmit: (values: AppointmentFormValues) => void;
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { branchId: '', serviceId: '', requestedStartTime: '', requestedEndTime: '' }
  });
  const selectedBranchId = watch('branchId');
  const filteredServices = useMemo(() => selectedBranchId ? services.filter((service) => service.branchId === selectedBranchId) : services, [selectedBranchId, services]);

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <CustomerLookup businessId={businessId} selectedCustomer={selectedCustomer} selectedProfile={selectedProfile} onCustomerSelect={onCustomerSelect} onProfileSelect={onProfileSelect} />
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Branch" placeholder="Select branch" options={branches.map((branch) => ({ label: branch.name, value: branch.id }))} error={errors.branchId?.message} {...register('branchId', { onChange: () => setValue('serviceId', '') })} />
        <Select label="Service" placeholder={selectedBranchId ? 'Select service' : 'Select branch first'} options={filteredServices.map((service) => ({ label: service.name, value: service.id }))} error={errors.serviceId?.message} disabled={!selectedBranchId} {...register('serviceId')} />
        <Input label="Requested start" type="datetime-local" error={errors.requestedStartTime?.message} {...register('requestedStartTime')} />
        <Input label="Requested end" type="datetime-local" error={errors.requestedEndTime?.message} {...register('requestedEndTime')} />
      </div>
      <Button type="submit" disabled={!selectedCustomer || !selectedProfile} isLoading={isSubmitting}>Request appointment</Button>
    </form>
  );
}
