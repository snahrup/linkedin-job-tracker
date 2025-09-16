import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ApplicationRec, FilterState } from './types';

// Initialize with environment variables if available
const getInitialClientId = () => {
  const stored = localStorage.getItem('gmail-client-id');
  return stored || import.meta.env.VITE_GMAIL_CLIENT_ID || null;
};

const getInitialOpenAIKey = () => {
  const stored = localStorage.getItem('openai-api-key');
  return stored || import.meta.env.VITE_OPENAI_API_KEY || null;
};

interface StoreState {
  // Auth
  clientId: string | null;
  accessToken: string | null;
  userEmail: string | null;
  openAIKey: string | null;
  
  // User Profile
  userResume: string | null;
  userSkills: string[];
  userPreferences: {
    desiredRoles: string[];
    minSalary: number | null;
    preferredLocations: string[];
    workMode: ('remote' | 'hybrid' | 'onsite')[];
  };
  
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
  setOpenAIKey: (key: string | null) => void;
  setUserResume: (resume: string | null) => void;
  setUserSkills: (skills: string[]) => void;
  setUserPreferences: (prefs: Partial<StoreState['userPreferences']>) => void;
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
      // Initialize with environment variables if available
      clientId: getInitialClientId(),
      accessToken: null,
      userEmail: null,
      openAIKey: getInitialOpenAIKey(),
      
      userResume: null,
      userSkills: [],
      userPreferences: {
        desiredRoles: [],
        minSalary: null,
        preferredLocations: [],
        workMode: []
      },
      
      lastUpdated: null,
      demoMode: false,
      apps: [],
      filters: {
        search: '',
        status: 'all',
        sortBy: 'date',
        sortOrder: 'desc',
        dateRange: 'all',
        matchScoreMin: 0
      },
      
      autoSync: false,
      syncInterval: 30,
      notifications: true,
      
      // Actions
      setClientId: (id) => set({ clientId: id }),
      setAccessToken: (token) => set({ accessToken: token }),
      setUserEmail: (email) => set({ userEmail: email }),
      setOpenAIKey: (key) => set({ openAIKey: key }),
      setUserResume: (resume) => set({ userResume: resume }),
      setUserSkills: (skills) => set({ userSkills: skills }),
      setUserPreferences: (prefs) => 
        set((state) => ({ 
          userPreferences: { ...state.userPreferences, ...prefs } 
        })),
      setDemoMode: (demo) => set({ demoMode: demo }),
      setApps: (apps) => set({ apps }),
      updateApp: (id, updates) =>
        set((state) => ({
          apps: state.apps.map((app) =>
            app.id === id ? { ...app, ...updates } : app
          ),
        })),
      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
      touchUpdated: () => set({ lastUpdated: new Date().toISOString() }),
      
      setAutoSync: (enabled) => set({ autoSync: enabled }),
      setSyncInterval: (minutes) => set({ syncInterval: minutes }),
      setNotifications: (enabled) => set({ notifications: enabled })
    }),
    {
      name: 'linkedin-tracker-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user preferences and data, not API keys from env
        userResume: state.userResume,
        userSkills: state.userSkills,
        userPreferences: state.userPreferences,
        demoMode: state.demoMode,
        apps: state.apps,
        filters: state.filters,
        lastUpdated: state.lastUpdated,
        autoSync: state.autoSync,
        syncInterval: state.syncInterval,
        notifications: state.notifications,
        // Only persist API keys if they're different from env vars
        clientId: state.clientId !== import.meta.env.VITE_GMAIL_CLIENT_ID ? state.clientId : null,
        openAIKey: state.openAIKey !== import.meta.env.VITE_OPENAI_API_KEY ? state.openAIKey : null
      })
    }
  )
);
