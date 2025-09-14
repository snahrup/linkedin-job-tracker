import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from './store';
import {
  Header,
  Filters,
  StatsRow,
  ApplicationGrid,
  Analytics,
  SettingsModal
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
    touchUpdated,
    autoSync,
    syncInterval,
    notifications
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  // Load demo data on mount if needed
  useEffect(() => {
    if (apps.length === 0 && !accessToken) {
      setDemoMode(true);
      setApps(generateDemoData());
      touchUpdated();
    }
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
      
      <div className="relative z-10">
        <Header
          onRefresh={() => fetchData()}
          onSettingsClick={() => setSettingsOpen(true)}
          onExport={() => exportToCSV(apps)}
          loading={loading}
        />

        <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
          {/* Sync Progress */}
          {syncProgress && (
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-blue-300">{syncProgress}</p>
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {/* Filters */}
          <Filters />

          {/* Stats */}
          <StatsRow stats={stats} />

          {/* Applications Grid */}
          <ApplicationGrid applications={filteredApps} />

          {/* Analytics */}
          {apps.length > 0 && <Analytics applications={filteredApps} />}
        </main>

        {/* Settings Modal */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;
