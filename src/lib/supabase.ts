import { createClient } from '@supabase/supabase-js';
import { ApplicationRec } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface DbApplication {
  id: string;
  user_id: string;
  company: string;
  position: string;
  location: string;
  application_date: string;
  status: string;
  view_date?: string;
  response_date?: string;
  description?: string;
  linkedin_url?: string;
  salary_range?: string;
  employment_type?: string;
  work_location?: string;
  company_size?: string;
  industry?: string;
  company_logo?: string;
  recruiter_name?: string;
  days_since_application: number;
  response_rate: number;
  email_ids: any; // JSON field
  status_history: any; // JSON field
  notes?: string;
  contact_info?: string;
  next_steps?: string;
  match_score?: any; // JSON field
  created_at: string;
  updated_at: string;
}

export interface DbUser {
  id: string;
  email: string;
  gmail_access_token?: string;
  openai_api_key?: string;
  user_resume?: string;
  user_skills: string[]; // JSON array
  user_preferences: any; // JSON field
  filters: any; // JSON field
  settings: any; // JSON field
  created_at: string;
  updated_at: string;
}

// Helper functions to convert between app types and database types
export function applicationToDb(app: ApplicationRec, userId: string): Omit<DbApplication, 'created_at' | 'updated_at'> {
  return {
    id: app.id,
    user_id: userId,
    company: app.company,
    position: app.position,
    location: app.location,
    application_date: app.applicationDate,
    status: app.status,
    view_date: app.viewDate,
    response_date: app.responseDate,
    description: app.description,
    linkedin_url: app.linkedinUrl,
    salary_range: app.salaryRange,
    employment_type: app.employmentType,
    work_location: app.workLocation,
    company_size: app.companySize,
    industry: app.industry,
    company_logo: app.companyLogo,
    recruiter_name: app.recruiterName,
    days_since_application: app.daysSinceApplication,
    response_rate: app.responseRate,
    email_ids: app.emailIds,
    status_history: app.statusHistory,
    notes: app.notes,
    contact_info: app.contactInfo,
    next_steps: app.nextSteps,
    match_score: app.matchScore,
  };
}

export function dbToApplication(dbApp: DbApplication): ApplicationRec {
  return {
    id: dbApp.id,
    company: dbApp.company,
    position: dbApp.position,
    location: dbApp.location,
    applicationDate: dbApp.application_date,
    status: dbApp.status as any,
    viewDate: dbApp.view_date,
    responseDate: dbApp.response_date,
    description: dbApp.description,
    linkedinUrl: dbApp.linkedin_url,
    salaryRange: dbApp.salary_range,
    employmentType: dbApp.employment_type as any,
    workLocation: dbApp.work_location as any,
    companySize: dbApp.company_size,
    industry: dbApp.industry,
    companyLogo: dbApp.company_logo,
    recruiterName: dbApp.recruiter_name,
    daysSinceApplication: dbApp.days_since_application,
    responseRate: dbApp.response_rate,
    emailIds: dbApp.email_ids || { application: undefined, viewed: undefined, response: [] },
    statusHistory: dbApp.status_history || [],
    notes: dbApp.notes,
    contactInfo: dbApp.contact_info,
    nextSteps: dbApp.next_steps,
    matchScore: dbApp.match_score,
  };
}