import { supabase, applicationToDb, dbToApplication, DbApplication, DbUser } from './supabase';
import { ApplicationRec, FilterState } from '../types';

// Applications CRUD
export async function saveApplication(app: ApplicationRec, userId: string): Promise<void> {
  const dbApp = applicationToDb(app, userId);
  
  const { error } = await supabase
    .from('applications')
    .upsert(dbApp, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    });
  
  if (error) {
    console.error('Error saving application:', error);
    throw new Error(`Failed to save application: ${error.message}`);
  }
}

export async function saveApplications(apps: ApplicationRec[], userId: string): Promise<void> {
  if (apps.length === 0) return;
  
  const dbApps = apps.map(app => applicationToDb(app, userId));
  
  const { error } = await supabase
    .from('applications')
    .upsert(dbApps, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    });
  
  if (error) {
    console.error('Error saving applications:', error);
    throw new Error(`Failed to save applications: ${error.message}`);
  }
}

export async function loadApplications(userId: string): Promise<ApplicationRec[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('application_date', { ascending: false });
  
  if (error) {
    console.error('Error loading applications:', error);
    throw new Error(`Failed to load applications: ${error.message}`);
  }
  
  return (data || []).map(dbToApplication);
}

export async function deleteApplication(appId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', appId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error deleting application:', error);
    throw new Error(`Failed to delete application: ${error.message}`);
  }
}

// User profile CRUD
export async function saveUserProfile(userId: string, profile: {
  email?: string;
  gmailAccessToken?: string;
  openaiApiKey?: string;
  userResume?: string;
  userSkills?: string[];
  userPreferences?: any;
  filters?: FilterState;
  settings?: any;
}): Promise<void> {
  const updateData: Partial<DbUser> = {};
  
  if (profile.email !== undefined) updateData.email = profile.email;
  if (profile.gmailAccessToken !== undefined) updateData.gmail_access_token = profile.gmailAccessToken;
  if (profile.openaiApiKey !== undefined) updateData.openai_api_key = profile.openaiApiKey;
  if (profile.userResume !== undefined) updateData.user_resume = profile.userResume;
  if (profile.userSkills !== undefined) updateData.user_skills = profile.userSkills;
  if (profile.userPreferences !== undefined) updateData.user_preferences = profile.userPreferences;
  if (profile.filters !== undefined) updateData.filters = profile.filters;
  if (profile.settings !== undefined) updateData.settings = profile.settings;
  
  const { error } = await supabase
    .from('users')
    .upsert({ 
      id: userId, 
      ...updateData 
    }, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    });
  
  if (error) {
    console.error('Error saving user profile:', error);
    throw new Error(`Failed to save user profile: ${error.message}`);
  }
}

export async function loadUserProfile(userId: string): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // User not found, return null
      return null;
    }
    console.error('Error loading user profile:', error);
    throw new Error(`Failed to load user profile: ${error.message}`);
  }
  
  return data;
}

// Sync functions for real-time updates
export async function syncApplicationsToSupabase(apps: ApplicationRec[], userId: string): Promise<void> {
  try {
    // First, get existing applications from Supabase
    const existingApps = await loadApplications(userId);
    const existingIds = new Set(existingApps.map(app => app.id));
    
    // Separate new apps from updates
    const newApps = apps.filter(app => !existingIds.has(app.id));
    const updatedApps = apps.filter(app => existingIds.has(app.id));
    
    // Batch save all applications
    await saveApplications([...newApps, ...updatedApps], userId);
    
    console.log(`Synced ${newApps.length} new and ${updatedApps.length} updated applications to Supabase`);
  } catch (error) {
    console.error('Error syncing applications to Supabase:', error);
    throw error;
  }
}

export async function syncApplicationsFromSupabase(userId: string): Promise<ApplicationRec[]> {
  try {
    const apps = await loadApplications(userId);
    console.log(`Loaded ${apps.length} applications from Supabase`);
    return apps;
  } catch (error) {
    console.error('Error syncing applications from Supabase:', error);
    throw error;
  }
}

// Utility function to check if user exists
export async function ensureUserExists(userId: string, email: string): Promise<void> {
  const existingUser = await loadUserProfile(userId);
  
  if (!existingUser) {
    // Create user profile
    await saveUserProfile(userId, { email });
    console.log('Created new user profile');
  }
}