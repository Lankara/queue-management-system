'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PublicBusiness, PublicClientProfile, PublicCustomer } from '@/types/public-queue';
import { QueueEntry } from '@/types/queue';
import { LanguageCode } from '@/types/business-setup';

export interface PublicQueueBooking {
  id: string;
  businessId: string;
  businessSlug: string;
  queueId: string;
  branchId: string | null;
  serviceId: string | null;
  customerId: string;
  clientProfileId: string;
  queueNumber: string;
  status: QueueEntry['status'];
  createdAt: string;
  updatedAt: string | null;
}

function toPublicQueueBooking(queueEntry: QueueEntry, businessSlug: string): PublicQueueBooking {
  return {
    id: queueEntry.id,
    businessId: queueEntry.businessId,
    businessSlug,
    queueId: queueEntry.queueId,
    branchId: queueEntry.branchId,
    serviceId: queueEntry.serviceId,
    customerId: queueEntry.customerId,
    clientProfileId: queueEntry.clientProfileId,
    queueNumber: queueEntry.queueNumber,
    status: queueEntry.status,
    createdAt: queueEntry.createdAt,
    updatedAt: queueEntry.updatedAt
  };
}

interface PublicQueueState {
  language: LanguageCode;
  business: PublicBusiness | null;
  customer: PublicCustomer | null;
  clientProfile: PublicClientProfile | null;
  queueEntry: QueueEntry | null;
  queueBookings: PublicQueueBooking[];
  appointmentId: string | null;
  selectedBranchId: string | null;
  selectedServiceId: string | null;
  setLanguage: (language: LanguageCode) => void;
  setBusiness: (business: PublicBusiness) => void;
  setCustomer: (customer: PublicCustomer | null) => void;
  setClientProfile: (clientProfile: PublicClientProfile | null) => void;
  setQueueEntry: (queueEntry: QueueEntry | null) => void;
  addQueueBooking: (queueEntry: QueueEntry, businessSlug: string) => void;
  removeQueueBooking: (queueEntryId: string) => void;
  setAppointmentId: (appointmentId: string | null) => void;
  setBranchAndService: (branchId: string | null, serviceId: string | null) => void;
  resetFlow: () => void;
}

export const usePublicQueueStore = create<PublicQueueState>()(
  persist(
    (set) => ({
      language: 'en',
      business: null,
      customer: null,
      clientProfile: null,
      queueEntry: null,
      queueBookings: [],
      appointmentId: null,
      selectedBranchId: null,
      selectedServiceId: null,
      setLanguage: (language) => set({ language }),
      setBusiness: (business) => set((state) => {
        if (state.business?.id === business.id) {
          return { business, language: business.defaultLanguage };
        }

        return {
          business,
          language: business.defaultLanguage,
          customer: null,
          clientProfile: null,
          queueEntry: null,
          queueBookings: (state.queueBookings ?? []).filter((booking) => booking.businessId === business.id),
          appointmentId: null,
          selectedBranchId: null,
          selectedServiceId: null
        };
      }),
      setCustomer: (customer) => set({ customer, clientProfile: null, queueEntry: null }),
      setClientProfile: (clientProfile) => set({ clientProfile, queueEntry: null }),
      setQueueEntry: (queueEntry) => set({ queueEntry }),
      addQueueBooking: (queueEntry, businessSlug) => set((state) => {
        const booking = toPublicQueueBooking(queueEntry, businessSlug);
        const others = (state.queueBookings ?? []).filter((item) => item.id !== queueEntry.id);
        return { queueBookings: [booking, ...others].slice(0, 8) };
      }),
      removeQueueBooking: (queueEntryId) => set((state) => ({
        queueBookings: (state.queueBookings ?? []).filter((booking) => booking.id !== queueEntryId),
        queueEntry: state.queueEntry?.id === queueEntryId ? null : state.queueEntry
      })),
      setAppointmentId: (appointmentId) => set({ appointmentId }),
      setBranchAndService: (selectedBranchId, selectedServiceId) => set({ selectedBranchId, selectedServiceId }),
      resetFlow: () => set({ customer: null, clientProfile: null, queueEntry: null, appointmentId: null, selectedBranchId: null, selectedServiceId: null })
    }),
    { name: 'queue-management-public-flow', storage: createJSONStorage(() => localStorage) }
  )
);


