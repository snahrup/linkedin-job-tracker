import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, RefreshCw, Bell } from 'lucide-react';
import { useStore } from '../store';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    clientId,
    setClientId,
    openAIKey,
    setOpenAIKey,
    userResume,
    setUserResume,
    userSkills,
    setUserSkills,
    demoMode,
    setDemoMode,
    autoSync,
    setAutoSync,
    syncInterval,
    setSyncInterval,
    notifications,
    setNotifications
  } = useStore();

  const [tempClientId, setTempClientId] = useState(clientId || '');
  const [tempOpenAIKey, setTempOpenAIKey] = useState(openAIKey || '');
  const [tempResume, setTempResume] = useState(userResume || '');
  const [tempSkills, setTempSkills] = useState(userSkills.join(', '));
  const [tempSyncInterval, setTempSyncInterval] = useState(syncInterval);

  useEffect(() => {
    if (isOpen) {
      setTempClientId(clientId || '');
      setTempOpenAIKey(openAIKey || '');
      setTempResume(userResume || '');
      setTempSkills(userSkills.join(', '));
      setTempSyncInterval(syncInterval);
    }
  }, [isOpen, clientId, openAIKey, userResume, userSkills, syncInterval]);

  const handleSave = () => {
    setClientId(tempClientId || null);
    setOpenAIKey(tempOpenAIKey || null);
    setUserResume(tempResume || null);
    setUserSkills(tempSkills.split(',').map(s => s.trim()).filter(Boolean));
    setSyncInterval(tempSyncInterval);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Settings</h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Google OAuth Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-300">Google OAuth Configuration</h3>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Client ID</label>
                    <input
                      type="text"
                      value={tempClientId}
                      onChange={(e) => setTempClientId(e.target.value)}
                      placeholder="xxxx.apps.googleusercontent.com"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm"
                    />
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-300 mt-0.5" />
                      <div className="text-xs text-amber-200 space-y-1">
                        <p>To set up Google OAuth:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Go to Google Cloud Console → APIs & Services</li>
                          <li>Create a new OAuth 2.0 Client ID (Web application)</li>
                          <li>Add http://localhost:3000 to Authorized JavaScript origins</li>
                          <li>Enable Gmail API in your project</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* OpenAI Configuration */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-300">AI Match Scoring</h3>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">OpenAI API Key</label>
                    <input
                      type="password"
                      value={tempOpenAIKey}
                      onChange={(e) => setTempOpenAIKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm"
                    />
                    <p className="text-xs text-slate-400">
                      Get your API key from platform.openai.com
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Your Skills (comma-separated)</label>
                    <input
                      type="text"
                      value={tempSkills}
                      onChange={(e) => setTempSkills(e.target.value)}
                      placeholder="React, TypeScript, Node.js, Python..."
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Resume Summary</label>
                    <textarea
                      value={tempResume}
                      onChange={(e) => setTempResume(e.target.value)}
                      placeholder="Paste your resume or a brief summary of your experience..."
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm h-32 resize-none"
                    />
                  </div>
                </div>
                
                {/* Demo Mode */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-300">Demo Mode</h3>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={demoMode}
                      onChange={(e) => setDemoMode(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <p className="text-sm text-white">Enable Demo Mode</p>
                      <p className="text-xs text-slate-400">Use sample data to preview the dashboard</p>
                    </div>
                  </label>
                </div>
                
                {/* Auto Sync */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-300">Synchronization</h3>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white">Auto-sync with Gmail</p>
                      <p className="text-xs text-slate-400">Automatically fetch new emails periodically</p>
                    </div>
                    <RefreshCw className="h-4 w-4 text-slate-400" />
                  </label>
                  
                  {autoSync && (
                    <div className="ml-7 space-y-2">
                      <label className="text-xs text-slate-400">Sync Interval (minutes)</label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={tempSyncInterval}
                        onChange={(e) => setTempSyncInterval(Number(e.target.value))}
                        className="w-32 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
                
                {/* Notifications */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-300">Notifications</h3>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white">Enable notifications</p>
                      <p className="text-xs text-slate-400">Get alerts for application status changes</p>
                    </div>
                    <Bell className="h-4 w-4 text-slate-400" />
                  </label>
                </div>
                
                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
