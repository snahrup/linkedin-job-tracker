export type AppStatus =
  | "pending"
  | "viewed"
  | "rejected"
  | "interview_requested"
  | "offer";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "temporary"
  | "internship";

export type WorkLocation = "remote" | "hybrid" | "onsite";

export interface ApplicationRec {
  id: string;
  company: string;
  position: string;
  location: string;
  applicationDate: string; // ISO
  status: AppStatus;
  viewDate?: string; // ISO
  responseDate?: string; // ISO
  description?: string;
  linkedinUrl?: string;
  salaryRange?: string;
  employmentType?: EmploymentType;
  workLocation?: WorkLocation;
  companySize?: string;
  industry?: string;
  companyLogo?: string;
  recruiterName?: string;
  daysSinceApplication: number;
  responseRate: number;
  emailIds: {
    application?: string;
    viewed?: string;
    response?: string[];
  };
  statusHistory: { 
    status: AppStatus; 
    timestamp: string; 
    source: "email" | "manual" | "linkedin" 
  }[];
  notes?: string;
  contactInfo?: string;
  nextSteps?: string;
  matchScore?: {
    overall: number;
    skills: number;
    experience: number;
    location: number;
    salary: number;
    reasons: string[];
    suggestions: string[];
    calculatedAt: string;
  };
}

export interface FilterState {
  query: string;
  statuses: AppStatus[];
  workLocations: WorkLocation[];
  employmentTypes: EmploymentType[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
  matchScoreMin?: number;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body?: string;
}

export interface Stats {
  total: number;
  viewed: number;
  interviews: number;
  offers: number;
  rejected: number;
  responseRate: number;
  avgResponseTime: number;
}
