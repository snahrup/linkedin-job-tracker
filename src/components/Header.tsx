import React from 'react';
import { RefreshCw, Settings, LogIn, LogOut, Download, Bell, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { formatRelativeDate } from '../utils';
import { clearExtractionCache } from '../aiExtraction';

interface HeaderProps {
  onRefresh: () => void;
  onSettingsClick: () => void;
  onExport: () => void;
  loading: boolean;
}

export function Header({ onRefresh, onSettingsClick, onExport, loading }: HeaderProps) {
  const { 
    accessToken, 
    lastUpdated, 
    userEmail, 
    notifications,
    demoMode 
  } = useStore();

  const handleConnect = () => {
    // This will be handled by the parent component
    const event = new CustomEvent('connectGmail');
    window.dispatchEvent(event);
  };

  const handleDisconnect = () => {
    const event = new CustomEvent('disconnectGmail');
    window.dispatchEvent(event);
  };

  return (
    <header className="sticky top-0 z-40 glass-card border-b">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                alt="LinkedIn" 
                className="h-8 w-8"
              />
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Job Application Tracker
                </h1>
                <p className="text-xs text-slate-400">
                  {demoMode ? "Demo Mode" : userEmail || "Not connected"} • 
                  {lastUpdated ? ` Updated ${formatRelativeDate(lastUpdated)}` : " Never synced"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {notifications && (
              <button className="btn-secondary">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Alerts</span>
              </button>
            )}
            
            <button
              onClick={onExport}
              className="btn-secondary"
              disabled={loading}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            
            <button
              onClick={() => {
                clearExtractionCache();
                alert('AI cache cleared! Next sync will reprocess all emails.');
              }}
              className="btn-secondary"
              title="Clear AI extraction cache"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Cache</span>
            </button>
            
            <button
              onClick={onRefresh}
              className="btn-secondary"
              disabled={loading || !accessToken || demoMode}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            
            <button
              onClick={onSettingsClick}
              className="btn-secondary"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            
            {accessToken ? (
              <button onClick={handleDisconnect} className="btn-primary bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            ) : (
              <button onClick={handleConnect} className="btn-primary">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Gmail</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
