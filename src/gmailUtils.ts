import { ApplicationRec, AppStatus, EmailMessage } from './types';

const EMAIL_QUERIES = {
  applicationSent: [
    'from:jobs-noreply@linkedin.com "application was sent"',
    'from:jobs-noreply@linkedin.com "applied to"',
    'from:linkedin.com subject:"application sent"',
    'from:linkedin.com "submitted your application"',
  ],
  applicationViewed: [
    'from:jobs-noreply@linkedin.com "viewed your application"',
    'from:linkedin.com "employer viewed"',
    'from:linkedin.com subject:"application viewed"',
  ],
  interview: [
    'from:linkedin.com "interview" OR "phone screen" OR "video call"',
    'subject:"interview" from:linkedin.com',
  ],
  rejection: [
    'from:linkedin.com "unfortunately" OR "not moving forward" OR "position filled"',
    'from:linkedin.com "regret to inform"',
  ],
  offer: [
    'from:linkedin.com "offer" OR "congratulations"',
    'from:linkedin.com "next steps" subject:"offer"',
  ],
};

// Gmail API functions
export async function gmailListMessages(
  token: string, 
  q: string, 
  maxResults = 50,
  pageToken?: string
): Promise<{ messages?: { id: string; threadId: string }[]; nextPageToken?: string }> {
  let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=${maxResults}`;
  if (pageToken) url += `&pageToken=${pageToken}`;
  
  const res = await fetch(url, { 
    headers: { Authorization: `Bearer ${token}` } 
  });
  
  if (!res.ok) throw new Error("Failed to list messages");
  return await res.json();
}

export async function gmailGetMessage(token: string, id: string): Promise<any> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`;
  const res = await fetch(url, { 
    headers: { Authorization: `Bearer ${token}` } 
  });
  
  if (!res.ok) throw new Error("Failed to get message");
  return await res.json();
}

export async function gmailGetProfile(token: string): Promise<{ emailAddress: string }> {
  const url = 'https://gmail.googleapis.com/gmail/v1/users/me/profile';
  const res = await fetch(url, { 
    headers: { Authorization: `Bearer ${token}` } 
  });
  
  if (!res.ok) throw new Error("Failed to get profile");
  return await res.json();
}

export function headerVal(payload: any, name: string): string {
  const h = payload?.headers?.find((x: any) => 
    x.name?.toLowerCase() === name.toLowerCase()
  );
  return h?.value || "";
}

export function decodeBody(payload: any): string {
  const walk = (p: any): string | null => {
    if (!p) return null;
    
    // Try to get text/plain first, then text/html
    if ((p.mimeType === "text/plain" || p.mimeType === "text/html") && p.body?.data) {
      try {
        return atob(p.body.data.replace(/-/g, "+").replace(/_/g, "/"));
      } catch {
        return null;
      }
    }
    
    if (p.parts && Array.isArray(p.parts)) {
      for (const part of p.parts) {
        const r = walk(part);
        if (r) return r;
      }
    }
    return null;
  };
  return walk(payload) || "";
}

// Enhanced parsing functions
export function parseCompanyAndRole(subject: string, snippet: string, body: string = "") {
  const fullText = `${subject} ${snippet} ${body}`.substring(0, 1000);
  
  let company = "Unknown Company";
  let position = "Unknown Position";
  
  // Pattern 1: "Your application was sent to [Company] for [Position]"
  const pattern1 = fullText.match(
    /(?:application was sent to|applied to|submitted.*to)\s+([A-Z][\w\s&.,'-]{1,50})\s+(?:for|–|-)\s+([A-Z][\w\s,/()&.-]{2,80})/i
  );
  if (pattern1) {
    company = pattern1[1].trim().replace(/\s+[,.]$/, '');
    position = pattern1[2].trim();
    return { company, position };
  }
  
  // Pattern 2: "[Company] viewed your application for [Position]"
  const pattern2 = fullText.match(
    /([A-Z][\w\s&.,'-]{1,50})\s+(?:viewed|received|reviewed).*application.*?(?:for|–|-)\s+([A-Z][\w\s,/()&.-]{2,80})/i
  );
  if (pattern2) {
    company = pattern2[1].trim();
    position = pattern2[2].trim();
    return { company, position };
  }
  
  // Pattern 3: Look for company names after "at" or "with"
  const companyPattern = fullText.match(/(?:at|with|from)\s+([A-Z][\w\s&.,'-]{2,50})(?:\s|,|\.)/i);
  if (companyPattern) {
    company = companyPattern[1].trim();
  }
  
  // Pattern 4: Look for job titles
  const titlePattern = fullText.match(
    /\b(Senior|Junior|Lead|Principal|Staff|Director|Manager|Engineer|Developer|Analyst|Designer|Architect|Specialist|Coordinator|Administrator|Executive|Consultant|Associate)[\w\s,/()&.-]{0,60}/i
  );
  if (titlePattern) {
    position = titlePattern[0].trim();
  }
  
  return { company, position };
}

export function detectStatus(subject: string, snippet: string, body: string = ""): AppStatus {
  const fullText = `${subject} ${snippet} ${body}`.toLowerCase();
  
  // Check for specific patterns in order of priority
  if (/offer|congratulations|pleased to offer|we'd like to offer/i.test(fullText)) {
    return "offer";
  }
  
  if (/interview|phone screen|video call|meet with|speak with you|schedule a call/i.test(fullText)) {
    return "interview_requested";
  }
  
  if (/unfortunately|not moving forward|position.*filled|regret|decided not to|other candidate/i.test(fullText)) {
    return "rejected";
  }
  
  if (/viewed|reviewed|looked at|seen your application/i.test(fullText)) {
    return "viewed";
  }
  
  return "pending";
}

export function extractLinkedInUrl(text: string): string | undefined {
  const urlMatch = text.match(
    /https?:\/\/(www\.)?linkedin\.com\/jobs\/view\/\d+/i
  );
  return urlMatch?.[0];
}

export function extractSalaryInfo(text: string): string | undefined {
  const salaryMatch = text.match(
    /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:year|hour|hr|annually))?/i
  );
  return salaryMatch?.[0];
}

// Main function to fetch and parse applications
export async function fetchApplicationsFromGmail(
  token: string,
  lookbackDays = 90,
  onProgress?: (message: string, progress: number) => void
): Promise<ApplicationRec[]> {
  const afterEpoch = Math.floor(Date.now() / 1000) - lookbackDays * 24 * 60 * 60;
  const dateFilter = `after:${afterEpoch}`;
  
  const allQueries = [
    ...EMAIL_QUERIES.applicationSent,
    ...EMAIL_QUERIES.applicationViewed,
    ...EMAIL_QUERIES.interview,
    ...EMAIL_QUERIES.rejection,
    ...EMAIL_QUERIES.offer,
  ].map(q => `${q} ${dateFilter}`);
  
  const messageIds = new Set<string>();
  let totalQueries = allQueries.length;
  
  // Fetch message IDs from all queries
  for (let i = 0; i < allQueries.length; i++) {
    const query = allQueries[i];
    onProgress?.(`Searching emails... (${i + 1}/${totalQueries})`, (i / totalQueries) * 0.3);
    
    try {
      const result = await gmailListMessages(token, query, 100);
      result.messages?.forEach(m => messageIds.add(m.id));
    } catch (error) {
      console.error(`Error with query "${query}":`, error);
    }
  }
  
  // Process each message
  const appsByKey = new Map<string, ApplicationRec>();
  const messageArray = Array.from(messageIds);
  
  for (let i = 0; i < messageArray.length; i++) {
    const id = messageArray[i];
    onProgress?.(`Processing emails... (${i + 1}/${messageArray.length})`, 0.3 + (i / messageArray.length) * 0.7);
    
    try {
      const msg = await gmailGetMessage(token, id);
      const payload = msg.payload || {};
      const subject = headerVal(payload, "Subject");
      const from = headerVal(payload, "From");
      const date = headerVal(payload, "Date");
      const snippet = msg.snippet || "";
      const body = decodeBody(payload);
      
      const status = detectStatus(subject, snippet, body);
      const { company, position } = parseCompanyAndRole(subject, snippet, body);
      
      const applicationDate = new Date(date || Date.now()).toISOString();
      const linkedinUrl = extractLinkedInUrl(body);
      const salaryRange = extractSalaryInfo(body);
      
      // Create unique key for deduplication
      const key = linkedinUrl || `${company}::${position}`.toLowerCase();
      
      const existing = appsByKey.get(key);
      const app: ApplicationRec = existing || {
        id: key,
        company,
        position,
        location: "Remote", // Default, can be enhanced with parsing
        applicationDate,
        status,
        description: subject,
        linkedinUrl,
        salaryRange,
        daysSinceApplication: 0,
        responseRate: 0,
        emailIds: { 
          application: undefined, 
          viewed: undefined, 
          response: [] 
        },
        statusHistory: [],
      };
      
      // Update status (keep most significant)
      if (shouldUpdateStatus(app.status, status)) {
        app.status = status;
        if (status === "viewed") app.viewDate = applicationDate;
        if (status === "interview_requested" || status === "offer" || status === "rejected") {
          app.responseDate = applicationDate;
        }
      }
      
      // Update email IDs
      if (status === "pending") {
        app.emailIds.application = app.emailIds.application || id;
      } else if (status === "viewed") {
        app.emailIds.viewed = id;
      } else {
        app.emailIds.response = [...(app.emailIds.response || []), id];
      }
      
      // Add to status history
      app.statusHistory = [
        ...app.statusHistory,
        { status, timestamp: applicationDate, source: "email" }
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Calculate days since application
      app.daysSinceApplication = Math.floor(
        (Date.now() - new Date(app.applicationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      appsByKey.set(key, app);
    } catch (error) {
      console.error(`Error processing message ${id}:`, error);
    }
  }
  
  // Calculate response rates
  const apps = Array.from(appsByKey.values());
  const totalApps = apps.length;
  const respondedApps = apps.filter(a => 
    ["viewed", "interview_requested", "offer", "rejected"].includes(a.status)
  ).length;
  const responseRate = totalApps > 0 ? respondedApps / totalApps : 0;
  
  return apps.map(app => ({ ...app, responseRate }));
}

function shouldUpdateStatus(current: AppStatus, candidate: AppStatus): boolean {
  const priority: Record<AppStatus, number> = {
    pending: 0,
    viewed: 1,
    rejected: 2,
    interview_requested: 3,
    offer: 4,
  };
  return priority[candidate] > priority[current];
}
