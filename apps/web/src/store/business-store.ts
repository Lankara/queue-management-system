'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface BusinessSelectionState {
  selectedBusinessId: string | null;
  selectedBusinessName: string | null;
  selectedBusinessType: string | null;
  selectedBusinessRole: string | null;
  setSelectedBusiness: (businessId: string, businessName?: string | null, businessType?: string | null, role?: string | null) => void;
  clearSelectedBusiness: () => void;
}

export const useBusinessStore = create<BusinessSelectionState>()(
  persist(
    (set) => ({
      selectedBusinessId: null,
      selectedBusinessName: null,
      selectedBusinessType: null,
      selectedBusinessRole: null,
      setSelectedBusiness: (selectedBusinessId, selectedBusinessName = null, selectedBusinessType = null, selectedBusinessRole = null) => set({ selectedBusinessId, selectedBusinessName, selectedBusinessType, selectedBusinessRole }),
      clearSelectedBusiness: () => set({ selectedBusinessId: null, selectedBusinessName: null, selectedBusinessType: null, selectedBusinessRole: null })
    }),
    {
      name: 'queue-management-selected-business',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
