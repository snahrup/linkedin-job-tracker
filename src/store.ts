import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApplicationRec, FilterState } from './types';

interface StoreState {
  // Auth
  clientId: string | null;
  accessToken: string | null;
  userEmail: string | null;
  
  // Data
  lastUpdated: string | null;
  demoMode: boolean;
  apps: ApplicationRec[];
  filters: FilterState;
  
  // Settings
  autoSync: boolean;
  syncInterval: number; // minutes
  notifications: boolean;
  
  // Actions
  setClientId: (id: string | null) => void;
  setAccessToken: (token: string | null) => void;
  setUserEmail: (email: string | null) => void;
  setDemoMode: (demo: boolean) => void;
  setApps: (apps: ApplicationRec[]) => void;
  updateApp: (id: string, updates: Partial<ApplicationRec>) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  touchUpdated: () => void;
  
  // Settings actions
  setAutoSync: (enabled: boolean) => void;
  setSyncInterval: (minutes: number) => void;
  setNotifications: (enabled: boolean) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // Initial state
      clientId: null,
      accessToken: null,
      userEmail: null,
      lastUpdated: null,
      demoMode: false,
      apps: [],
      filters: {
        query: "",
        statuses: ["pending", "viewed", "interview_requested", "offer", "rejected"],
        workLocations: ["remote", "hybrid", "onsite"],
        employmentTypes: ["full_time", "part_time", "contract", "temporary"],
      },
      autoSync: false,
      syncInterval: 30, // 30 minutes default
      notifications: true,
      
      // Actions
      setClientId: (id) => set({ clientId: id }),
      setAccessToken: (token) => set({ accessToken: token }),
      setUserEmail: (email) => set({ userEmail: email }),
      setDemoMode: (demo) => set({ demoMode: demo }),
      setApps: (apps) => set({ apps }),
      updateApp: (id, updates) => set((state) => ({
        apps: state.apps.map(app => 
          app.id === id ? { ...app, ...updates } : app
        )
      })),
      setFilters: (filters) => set((state) => ({ 
        filters: { ...state.filters, ...filters } 
      })),
      touchUpdated: () => set({ lastUpdated: new Date().toISOString() }),
      setAutoSync: (enabled) => set({ autoSync: enabled }),
      setSyncInterval: (minutes) => set({ syncInterval: minutes }),
      setNotifications: (enabled) => set({ notifications: enabled }),
    }),
    {
      name: 'linkedin-job-tracker',
      partialize: (state) => ({
        clientId: state.clientId,
        autoSync: state.autoSync,
        syncInterval: state.syncInterval,
        notifications: state.notifications,
        filters: state.filters,
      }),
    }
  )
);
