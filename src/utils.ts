import { ApplicationRec, AppStatus, Stats } from './types';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

export const STATUS_COLORS: Record<AppStatus, string> = {
  pending: "bg-amber-500/30 text-amber-300 border-amber-500/50",
  viewed: "bg-emerald-500/30 text-emerald-300 border-emerald-500/50",
  rejected: "bg-rose-500/30 text-rose-300 border-rose-500/50",
  interview_requested: "bg-violet-500/30 text-violet-300 border-violet-500/50",
  offer: "bg-cyan-500/30 text-cyan-300 border-cyan-500/50",
};

export const STATUS_LABELS: Record<AppStatus, string> = {
  pending: "Pending",
  viewed: "Viewed",
  rejected: "Rejected",
  interview_requested: "Interview",
  offer: "Offer",
};

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function daysBetween(date1: string | Date, date2: string | Date): number {
  return Math.abs(differenceInDays(new Date(date1), new Date(date2)));
}

export function buildStats(apps: ApplicationRec[]): Stats {
  const total = apps.length;
  const viewed = apps.filter(a => a.status === "viewed").length;
  const interviews = apps.filter(a => a.status === "interview_requested").length;
  const offers = apps.filter(a => a.status === "offer").length;
  const rejected = apps.filter(a => a.status === "rejected").length;
  
  const responded = viewed + interviews + offers + rejected;
  const responseRate = total > 0 ? responded / total : 0;
  
  // Calculate average response time
  const responseTimes = apps
    .filter(a => a.applicationDate && a.responseDate)
    .map(a => daysBetween(a.applicationDate, a.responseDate!));
  
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;
  
  return {
    total,
    viewed,
    interviews,
    offers,
    rejected,
    responseRate,
    avgResponseTime,
  };
}

export function exportToCSV(apps: ApplicationRec[]): void {
  const headers = [
    "Company",
    "Position",
    "Location",
    "Status",
    "Applied Date",
    "Days Since",
    "View Date",
    "Response Date",
    "Salary Range",
    "Employment Type",
    "Work Location",
    "LinkedIn URL",
    "Notes",
  ];
  
  const rows = apps.map(app => [
    escapeCSV(app.company),
    escapeCSV(app.position),
    escapeCSV(app.location),
    app.status,
    formatDate(app.applicationDate),
    app.daysSinceApplication.toString(),
    app.viewDate ? formatDate(app.viewDate) : "",
    app.responseDate ? formatDate(app.responseDate) : "",
    escapeCSV(app.salaryRange || ""),
    app.employmentType || "",
    app.workLocation || "",
    escapeCSV(app.linkedinUrl || ""),
    escapeCSV(app.notes || ""),
  ]);
  
  const csv = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `job_applications_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCSV(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Demo data generator
export function generateDemoData(): ApplicationRec[] {
  const companies = [
    { name: "Google", logo: "🔍" },
    { name: "Microsoft", logo: "🪟" },
    { name: "Amazon Web Services", logo: "☁️" },
    { name: "Meta", logo: "👥" },
    { name: "Apple", logo: "🍎" },
    { name: "Netflix", logo: "📺" },
    { name: "Spotify", logo: "🎵" },
    { name: "Uber Technologies", logo: "🚗" },
    { name: "Airbnb", logo: "🏠" },
    { name: "Tesla", logo: "⚡" },
    { name: "LinkedIn", logo: "💼" },
    { name: "Adobe", logo: "🎨" },
    { name: "Salesforce", logo: "☁️" },
    { name: "Oracle", logo: "🗄️" },
    { name: "IBM", logo: "💻" },
  ];
  
  const positions = [
    "Senior Software Engineer",
    "Product Manager", 
    "Data Scientist",
    "UX Designer",
    "DevOps Engineer",
    "Business Intelligence Analyst",
    "Technical Lead",
    "Solutions Architect",
    "Full Stack Developer",
    "Machine Learning Engineer",
    "Cloud Architect",
    "Frontend Developer",
    "Backend Engineer",
    "Data Engineer",
    "Security Engineer",
    "Mobile Developer",
    "QA Engineer",
    "Site Reliability Engineer",
    "Engineering Manager",
    "Director of Engineering",
    "VP of Product",
    "Data Analytics Manager",
    "Senior Data Consultant",
    "Business Intelligence Developer",
    "Snowflake Architect",
  ];
  
  const locations = [
    "San Francisco, CA",
    "New York, NY", 
    "Remote",
    "Seattle, WA",
    "Austin, TX",
    "Boston, MA",
    "Los Angeles, CA",
    "Chicago, IL",
    "Denver, CO",
    "Atlanta, GA",
  ];
  
  const statuses: AppStatus[] = ["pending", "viewed", "interview_requested", "offer", "rejected"];
  
  return Array.from({ length: 20 }, (_, i) => {
    const company = companies[i % companies.length];
    const position = positions[i % positions.length];
    const location = locations[i % locations.length];
    const daysAgo = Math.floor(Math.random() * 60) + 1;
    const applicationDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const app: ApplicationRec = {
      id: `demo-${i}`,
      company: company.name,
      position,
      location,
      applicationDate: applicationDate.toISOString(),
      status,
      viewDate: status !== "pending" ? new Date(applicationDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      responseDate: ["interview_requested", "offer", "rejected"].includes(status) 
        ? new Date(applicationDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() 
        : undefined,
      linkedinUrl: `https://www.linkedin.com/jobs/view/${3000000000 + i}`,
      salaryRange: "$120,000 - $180,000",
      employmentType: "full_time",
      workLocation: location === "Remote" ? "remote" : i % 3 === 1 ? "hybrid" : "onsite",
      companyLogo: company.logo,
      daysSinceApplication: daysAgo,
      responseRate: 0.65,
      emailIds: {
        application: `demo-app-${i}`,
        viewed: status !== "pending" ? `demo-view-${i}` : undefined,
        response: [],
      },
      statusHistory: [
        { status: "pending", timestamp: applicationDate.toISOString(), source: "manual" },
        ...(status !== "pending" ? [{ 
          status, 
          timestamp: new Date(applicationDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), 
          source: "email" as const
        }] : []),
      ],
      notes: i % 3 === 0 ? "Follow up scheduled for next week" : undefined,
    };
    
    return app;
  });
}
