import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRow, VehicleRow } from '@/types/database';

interface ComplaintDraft {
  vehicleId: string | null;
  brand: string;
  model: string;
  year: number | null;
  engine: string;
  category: string;
  symptoms: string[];
  kmAtComplaint: number | null;
  description: string;
  severity: number;
  isRecurring: boolean;
}

interface AppState {
  // Auth
  user: UserRow | null;
  setUser: (user: UserRow | null) => void;

  // Complaint wizard
  complaintDraft: ComplaintDraft;
  setComplaintDraft: (draft: Partial<ComplaintDraft>) => void;
  resetComplaintDraft: () => void;
  complaintStep: number;
  setComplaintStep: (step: number) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const defaultDraft: ComplaintDraft = {
  vehicleId: null,
  brand: '',
  model: '',
  year: null,
  engine: '',
  category: '',
  symptoms: [],
  kmAtComplaint: null,
  description: '',
  severity: 3,
  isRecurring: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      complaintDraft: defaultDraft,
      setComplaintDraft: (draft) =>
        set((state) => ({
          complaintDraft: { ...state.complaintDraft, ...draft },
        })),
      resetComplaintDraft: () => set({ complaintDraft: defaultDraft, complaintStep: 0 }),
      complaintStep: 0,
      setComplaintStep: (step) => set({ complaintStep: step }),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'arabasikayet-store',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
