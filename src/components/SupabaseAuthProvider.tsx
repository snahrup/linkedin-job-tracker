import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { onAuthStateChange, getGmailAccessToken } from '../lib/supabaseAuth';
import { ensureUserExists, syncApplicationsToSupabase, syncApplicationsFromSupabase, saveUserProfile } from '../lib/supabaseService';
import { useStore } from '../store';

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
}

export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const {
    setSupabaseUserId,
    setUserEmail,
    setAccessToken,
    setDemoMode,
    apps,
    setApps,
    userResume,
    userSkills,
    userPreferences,
    filters,
    useSupabase,
    touchUpdated
  } = useStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!useSupabase) {
      setIsInitialized(true);
      return;
    }

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      setUser(user);
      
      if (user) {
        console.log('User authenticated:', user.email);
        
        // Update store with user info
        setSupabaseUserId(user.id);
        setUserEmail(user.email || null);
        setDemoMode(false);
        
        try {
          // Ensure user exists in database
          await ensureUserExists(user.id, user.email || '');
          
          // Get Gmail access token if available
          const gmailToken = await getGmailAccessToken();
          if (gmailToken) {
            setAccessToken(gmailToken);
          }
          
          // Sync user profile to Supabase
          await saveUserProfile(user.id, {
            email: user.email || '',
            gmailAccessToken: gmailToken || undefined,
            userResume: userResume || undefined,
            userSkills,
            userPreferences,
            filters,
          });
          
          // Load existing applications from Supabase
          const supabaseApps = await syncApplicationsFromSupabase(user.id);
          
          // If user has local apps but no Supabase apps, sync local to Supabase
          if (apps.length > 0 && supabaseApps.length === 0) {
            console.log('Syncing local applications to Supabase...');
            await syncApplicationsToSupabase(apps, user.id);
          } else if (supabaseApps.length > 0) {
            // Use Supabase data as source of truth
            console.log('Loading applications from Supabase...');
            setApps(supabaseApps);
            touchUpdated();
          }
          
        } catch (error) {
          console.error('Error during auth setup:', error);
        }
        
      } else {
        console.log('User signed out');
        setSupabaseUserId(null);
        setUserEmail(null);
        setAccessToken(null);
        // Don't clear apps immediately - let user decide
      }
      
      setIsInitialized(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [useSupabase, setSupabaseUserId, setUserEmail, setAccessToken, setDemoMode, 
      apps, setApps, userResume, userSkills, userPreferences, filters, touchUpdated]);

  // Auto-sync applications when they change (if user is authenticated)
  useEffect(() => {
    if (!useSupabase || !user || apps.length === 0) return;
    
    const syncTimeout = setTimeout(async () => {
      try {
        await syncApplicationsToSupabase(apps, user.id);
        console.log('Auto-synced applications to Supabase');
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, 2000); // Debounce syncing

    return () => clearTimeout(syncTimeout);
  }, [apps, user, useSupabase]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}