import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from './store';
import {
  Header,
  Filters,
  StatsRow,
  ApplicationGrid,
  Analytics,
  SettingsModal,
  SupabaseAuthProvider,
  AuthModal
} from './components';
import {
  fetchApplicationsFromGmail,
  gmailGetProfile
} from './gmailUtils';
import {
  buildStats,
  exportToCSV,
  generateDemoData
} from './utils';
import { ApplicationRec } from './types';

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

function App() {
  const {
    clientId,
    accessToken,
    setAccessToken,
    userEmail,
    setUserEmail,
    demoMode,
    setDemoMode,
    apps,
    setApps,
    filters,
    filtersCollapsed,
    touchUpdated,
    autoSync,
    syncInterval,
    notifications,
    supabaseUserId,
    useSupabase
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const tokenClientRef = useRef<any>(null);

  // Load Google Identity Services
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGsiLoaded(true);
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize token client
  useEffect(() => {
    if (!gsiLoaded || !clientId || !window.google?.accounts?.oauth2) return;

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      callback: async (response: any) => {
        if (response.access_token) {
          setAccessToken(response.access_token);
          
          // Get user email
          try {
            const profile = await gmailGetProfile(response.access_token);
            setUserEmail(profile.emailAddress);
          } catch (error) {
            console.error('Failed to get user profile:', error);
          }
          
          // Auto-fetch data after connecting
          fetchData(response.access_token);
        }
      },
    });
  }, [gsiLoaded, clientId, setAccessToken, setUserEmail]);

  // Auto-sync interval
  useEffect(() => {
    if (!autoSync || !accessToken || demoMode) return;

    const interval = setInterval(() => {
      fetchData(accessToken);
    }, syncInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, accessToken, demoMode]);

  // Event listeners for auth
  useEffect(() => {
    const handleConnect = () => {
      if (!tokenClientRef.current) {
        alert('Please configure your Google OAuth Client ID in Settings first.');
        setSettingsOpen(true);
        return;
      }
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    };

    const handleDisconnect = () => {
      setAccessToken(null);
      setUserEmail(null);
      setApps([]);
    };

    window.addEventListener('connectGmail', handleConnect);
    window.addEventListener('disconnectGmail', handleDisconnect);

    return () => {
      window.removeEventListener('connectGmail', handleConnect);
      window.removeEventListener('disconnectGmail', handleDisconnect);
    };
  }, [setAccessToken, setUserEmail, setApps]);

  // Show auth modal if not authenticated and no apps
  useEffect(() => {
    if (useSupabase && !supabaseUserId && apps.length === 0 && !demoMode) {
      setAuthModalOpen(true);
    }
  }, [useSupabase, supabaseUserId, apps.length, demoMode]);

  const fetchData = async (token: string = accessToken!) => {
    if (demoMode) {
      setApps(generateDemoData());
      touchUpdated();
      return;
    }

    if (!token) {
      alert('Please connect Gmail first.');
      return;
    }

    setLoading(true);
    setSyncProgress('Starting sync...');

    try {
      const applications = await fetchApplicationsFromGmail(
        token,
        90,
        (message, progress) => {
          setSyncProgress(message);
        }
      );
      
      setApps(applications);
      touchUpdated();
      
      // Show notification if enabled
      if (notifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Job Tracker Sync Complete', {
          body: `Synced ${applications.length} applications`,
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      alert('Failed to sync with Gmail. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setSyncProgress(null);
    }
  };

  // Request notification permission
  useEffect(() => {
    if (notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notifications]);

  // Filter applications
  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      // Search query
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchText = `${app.company} ${app.position} ${app.location}`.toLowerCase();
        if (!searchText.includes(query)) return false;
      }

      // Status filter
      if (!filters.statuses.includes(app.status)) return false;

      // Date range
      if (filters.dateFrom && new Date(app.applicationDate) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(app.applicationDate) > new Date(filters.dateTo)) {
        return false;
      }

      // Work location
      if (app.workLocation && !filters.workLocations.includes(app.workLocation)) {
        return false;
      }

      // Employment type
      if (app.employmentType && !filters.employmentTypes.includes(app.employmentType)) {
        return false;
      }

      return true;
    });
  }, [apps, filters]);

  const stats = useMemo(() => buildStats(filteredApps), [filteredApps]);

  return (
    <SupabaseAuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20" />
        </div>
        
        <div className="relative z-10">
          {/* Add safe area padding for iPhone notch */}
          <div className="safe-top" />
          
          <Header
            onRefresh={() => fetchData()}
            onSettingsClick={() => setSettingsOpen(true)}
            onExport={() => exportToCSV(apps)}
            loading={loading}
          />

        <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Sync Progress */}
          {syncProgress && (
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-blue-300">{syncProgress}</p>
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {/* Conditional Layout based on filters collapsed state */}
          {filtersCollapsed ? (
            <>
              {/* KPI Cards First when collapsed */}
              <StatsRow stats={stats} />
              
              {/* Collapsed Filters */}
              <Filters />
              
              {/* Applications Grid */}
              <ApplicationGrid applications={filteredApps} />
            </>
          ) : (
            <>
              {/* Expanded Filters First */}
              <Filters />
              
              {/* KPI Cards */}
              <StatsRow stats={stats} />
              
              {/* Applications Grid */}
              <ApplicationGrid applications={filteredApps} />
            </>
          )}

          {/* Analytics - Hidden on small screens for performance */}
          {apps.length > 0 && (
            <div className="hidden sm:block">
              <Analytics applications={filteredApps} />
            </div>
          )}
          
          {/* Show analytics button on mobile */}
          {apps.length > 0 && (
            <div className="block sm:hidden">
              <button 
                onClick={() => alert('Analytics view coming soon for mobile!')}
                className="w-full py-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-300 text-sm font-medium"
              >
                View Analytics →
              </button>
            </div>
          )}
        </main>

          {/* Settings Modal */}
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />

          {/* Auth Modal */}
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />
        </div>
      </div>
    </SupabaseAuthProvider>
  );
}

export default App;
