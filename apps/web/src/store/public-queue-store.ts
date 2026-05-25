'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PublicBusiness, PublicClientProfile, PublicCustomer } from '@/types/public-queue';
import { QueueEntry } from '@/types/queue';
import { LanguageCode } from '@/types/business-setup';

interface PublicQueueState {
  language: LanguageCode;
  business: PublicBusiness | null;
  customer: PublicCustomer | null;
  clientProfile: PublicClientProfile | null;
  queueEntry: QueueEntry | null;
  appointmentId: string | null;
  selectedBranchId: string | null;
  selectedServiceId: string | null;
  setLanguage: (language: LanguageCode) => void;
  setBusiness: (business: PublicBusiness) => void;
  setCustomer: (customer: PublicCustomer | null) => void;
  setClientProfile: (clientProfile: PublicClientProfile | null) => void;
  setQueueEntry: (queueEntry: QueueEntry | null) => void;
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
      appointmentId: null,
      selectedBranchId: null,
      selectedServiceId: null,
      setLanguage: (language) => set({ language }),
      setBusiness: (business) => set({ business, language: business.defaultLanguage }),
      setCustomer: (customer) => set({ customer, clientProfile: null, queueEntry: null }),
      setClientProfile: (clientProfile) => set({ clientProfile, queueEntry: null }),
      setQueueEntry: (queueEntry) => set({ queueEntry }),
      setAppointmentId: (appointmentId) => set({ appointmentId }),
      setBranchAndService: (selectedBranchId, selectedServiceId) => set({ selectedBranchId, selectedServiceId }),
      resetFlow: () => set({ customer: null, clientProfile: null, queueEntry: null, appointmentId: null, selectedBranchId: null, selectedServiceId: null })
    }),
    { name: 'queue-management-public-flow', storage: createJSONStorage(() => localStorage) }
  )
);


