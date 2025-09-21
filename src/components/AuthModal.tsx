import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, LogIn, Database, Zap } from 'lucide-react';
import { signInWithEmail, signInWithGmail } from '../lib/supabaseAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithEmail(email);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGmailAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithGmail();
      // Will redirect to Gmail OAuth flow
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gmail authentication failed');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 grid place-items-center">
                      <Database className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Sign In</h2>
                      <p className="text-sm text-slate-400">Connect to sync your data</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {emailSent ? (
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-green-600/20 border border-green-500/30 grid place-items-center mx-auto mb-4">
                      <Mail className="h-6 w-6 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Check your email</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      We sent a magic link to <strong>{email}</strong>
                    </p>
                    <button
                      onClick={() => setEmailSent(false)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Try a different email
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Benefits */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Zap className="h-4 w-4 text-yellow-400" />
                        <span>Sync data across devices</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Database className="h-4 w-4 text-blue-400" />
                        <span>Secure cloud storage</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Mail className="h-4 w-4 text-green-400" />
                        <span>Gmail integration</span>
                      </div>
                    </div>

                    {/* Gmail Auth Button */}
                    <button
                      onClick={handleGmailAuth}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 disabled:bg-slate-700/50 border border-red-500/30 rounded-lg transition-all text-white disabled:text-slate-500"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {isLoading ? 'Connecting...' : 'Continue with Gmail'}
                    </button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-600"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-900 text-slate-400">or</span>
                      </div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Email address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isLoading || !email}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg text-white disabled:text-slate-500 transition-colors"
                      >
                        <LogIn className="h-4 w-4" />
                        {isLoading ? 'Sending...' : 'Send magic link'}
                      </button>
                    </form>

                    {error && (
                      <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 text-center">
                      By signing in, you agree to sync your data with our secure servers.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}