import { ApplicationRec, AppStatus, EmailMessage } from './types';
import { extractJobInfoCached } from './aiExtraction';
import { calculateMatchScore } from './aiScoring';

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

// Enhanced parsing functions with better company extraction
export function parseCompanyAndRole(subject: string, snippet: string, body: string = "") {
  let company = "Unknown Company";
  let position = "Unknown Position";
  let location = "";
  
  // Clean and prepare text
  const cleanText = (text: string) => text
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/-{3,}/g, '')  // Remove separator lines
    .trim();
  
  const cleanedSubject = cleanText(subject);
  const cleanedSnippet = cleanText(snippet);
  const cleanedBody = cleanText(body).substring(0, 3000);
  
  // Combine all text for comprehensive searching
  const fullText = `${cleanedSubject} ${cleanedSnippet} ${cleanedBody}`;
  
  // Primary patterns for LinkedIn emails
  const patterns = [
    // "Your application was sent to [Company]" (then look for position separately)
    {
      regex: /Your application was sent to\s+([^\.]+?)(?:\s+for\s+(.+?))?(?:\.|$)/i,
      parse: (match: RegExpMatchArray) => {
        company = match[1].trim();
        if (match[2]) {
          position = match[2].trim();
        }
      }
    },
    // "[Company] viewed your application for [Position]"
    {
      regex: /^(.+?)\s+viewed your application(?:\s+for\s+(.+?))?(?:\.|$)/i,
      parse: (match: RegExpMatchArray) => {
        company = match[1].trim();
        if (match[2]) {
          position = match[2].trim();
        }
      }
    },
    // "application was sent to [Company]" - look for company after "sent to"
    {
      regex: /application was sent to\s+([^\.]+?)(?:\.|$)/i,
      parse: (match: RegExpMatchArray) => {
        company = match[1].trim();
      }
    }
  ];
  
  // Try subject first (most reliable)
  for (const pattern of patterns) {
    const match = cleanedSubject.match(pattern.regex);
    if (match) {
      pattern.parse(match);
      break;
    }
  }
  
  // If no company found in subject, try snippet
  if (company === "Unknown Company") {
    for (const pattern of patterns) {
      const match = cleanedSnippet.match(pattern.regex);
      if (match) {
        pattern.parse(match);
        break;
      }
    }
  }
  
  // Extract position from the full text if not found
  if (position === "Unknown Position") {
    // LinkedIn specific position patterns
    const positionPatterns = [
      // Look for "View similar jobs you may be interested in [Position]"
      /View similar jobs you may be interested in\s+([^\.]+?)(?:\s+at\s+|$)/i,
      // "interested in [Position] (Remote"
      /interested in\s+([A-Z][^(\.]+?)(?:\s*\(|\s+at\s+|\.|$)/i,
      // Common job listing format: "Position at Company"
      /(?:^|\s)([A-Z][^\.]+?)\s+at\s+[A-Z]/,
      // After "for" in various contexts
      /\bfor\s+([A-Z][^\.]+?)(?:\s+at\s+|\s+in\s+|\.|,|$)/i,
      // Look for standalone job titles with common patterns
      /\b((?:Senior|Junior|Lead|Principal|Staff|Sr\.?|Jr\.?)\s+)?(?:Software|Frontend|Backend|Full[\s-]?Stack|Data|DevOps|Cloud|Security|QA|Quality|Test|Mobile|iOS|Android|Web|UI|UX|Product|Project|Program|Business|Marketing|Sales|Customer|Support|HR|Finance|Legal|Operations|Research|Machine[\s-]?Learning|ML|AI|Artificial[\s-]?Intelligence|Business[\s-]?Intelligence|BI)\s+(?:Engineer|Developer|Architect|Manager|Analyst|Scientist|Designer|Specialist|Consultant|Administrator|Coordinator|Director|VP|Vice[\s-]?President|Lead|Head|Officer|Executive|Intern|Associate|Expert|Professional)(?:\s+I{1,3})?/i,
      // Common title formats
      /\b(Director of\s+[A-Z][^,\.]+)/i,
      /\b(Head of\s+[A-Z][^,\.]+)/i,
      /\b(VP of\s+[A-Z][^,\.]+)/i,
      // Snowflake Architect, Data Scientist, etc.
      /\b([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*\s+(?:Architect|Scientist|Engineer|Developer|Designer|Manager|Analyst|Specialist|Consultant))/,
    ];
    
    // Try each pattern on the full text
    for (const pattern of positionPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const extractedPosition = match[1].trim();
        // Validate it's a reasonable job title
        if (extractedPosition.length > 5 && extractedPosition.length < 100 && 
            !extractedPosition.toLowerCase().includes('your application') &&
            !extractedPosition.toLowerCase().includes('view similar') &&
            !extractedPosition.toLowerCase().includes('more success')) {
          position = extractedPosition;
          break;
        }
      }
    }
    
    // If still not found, look in specific sections of the snippet/body
    if (position === "Unknown Position") {
      // Try to find position after company name if we have it
      if (company !== "Unknown Company") {
        const companyPattern = new RegExp(`${company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?(?:for|hiring|seeking|looking for|position:?)\\s+([^,\\.]+)`, 'i');
        const companyMatch = fullText.match(companyPattern);
        if (companyMatch) {
          position = companyMatch[1].trim();
        }
      }
    }
  }
  
  // Extract location from body
  const locationPatterns = [
    /(?:Location|Based in|Office|Located in):\s*([^,\.\n]+)/i,
    /\((Remote|Hybrid|On-?site)\)/i,
    /\b(Remote|Hybrid|On-?site)\s+(?:position|role|job|opportunity)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const locationMatch = fullText.match(pattern);
    if (locationMatch) {
      location = locationMatch[1].trim();
      break;
    }
  }
  
  // Clean up the results
  company = cleanCompanyName(company);
  position = cleanPositionTitle(position);
  location = cleanLocation(location);
  
  // Debug logging to see what we're extracting
  console.log('Parsing result:', { company, position, location });
  console.log('From subject:', cleanedSubject.substring(0, 100));
  console.log('From snippet:', cleanedSnippet.substring(0, 200));
  
  return { company, position, location };
}

function cleanCompanyName(name: string): string {
  if (!name || name === "Unknown Company") return "Unknown Company";
  
  // Remove common artifacts but preserve company name format
  name = name
    .replace(/^Your application was sent to\s*/i, '')
    .replace(/\s+viewed your application.*$/i, '')
    .replace(/^(the\s+)/i, '')
    .trim();
  
  // Remove any email/URL artifacts
  name = name.split(/\s+(?:http|www\.|@)/)[0].trim();
  
  // Clean up but preserve original casing for proper names
  if (name.length > 0 && name.length < 100) {
    return name;
  }
  
  return "Unknown Company";
}

function cleanPositionTitle(title: string): string {
  if (!title || title === "Unknown Position") return "Unknown Position";
  
  // Remove common artifacts and clean
  title = title
    .replace(/^for\s+/i, '')
    .replace(/\s+at\s+.+$/i, '')  // Remove "at [Company]" suffix
    .replace(/\s+in\s+.+$/i, '')  // Remove "in [Location]" suffix
    .replace(/\s*\(.*?\)\s*/g, ' ')  // Remove parenthetical content
    .replace(/View similar.*/i, '')  // Remove "View similar jobs" text
    .replace(/more success.*/i, '')  // Remove "more success" text
    .replace(/Apply with.*/i, '')  // Remove "Apply with" text
    .replace(/\s+/g, ' ')
    .trim();
  
  // Common position title cleanups
  const titleCleanups = [
    { pattern: /^(.+?)\s*[-–—]\s*/, replacement: '$1' },  // Remove dashes and content after
    { pattern: /^(.+?)\s*\|/, replacement: '$1' },  // Remove pipes and content after
    { pattern: /\s*\d+\s*(?:school|alumni|developer|engineer).*$/i, replacement: '' },  // Remove trailing numbers and keywords
  ];
  
  for (const cleanup of titleCleanups) {
    title = title.replace(cleanup.pattern, cleanup.replacement).trim();
  }
  
  // Validate it looks like a job title
  if (title.length > 5 && title.length < 100 && 
      !title.includes('http') && 
      !title.toLowerCase().includes('your application') &&
      !title.toLowerCase().includes('now, take')) {
    return title;
  }
  
  return "Unknown Position";
}

function cleanLocation(location: string): string {
  if (!location) return "";
  
  // Clean up location
  location = location
    .replace(/[,\s]+$/, '')
    .replace(/^[,\s]+/, '')
    .trim();
  
  // Common location formats
  if (location.match(/^(Remote|Hybrid|On-?site|In-?office)$/i)) {
    return location;
  }
  
  // City, State format
  if (location.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*[A-Z]{2}$/)) {
    return location;
  }
  
  return location.substring(0, 50);
}

export function detectStatus(subject: string, snippet: string, body: string = ""): AppStatus {
  const fullText = `${subject} ${snippet} ${body}`.toLowerCase();
  
  // Log for debugging
  console.log('Detecting status from:', subject.substring(0, 100));
  
  // Check for specific patterns in order of priority
  if (/offer|congratulations|pleased to offer|we'd like to offer/i.test(fullText)) {
    console.log('Status detected: OFFER');
    return "offer";
  }
  
  if (/interview|phone screen|video call|meet with|speak with you|schedule a call/i.test(fullText)) {
    console.log('Status detected: INTERVIEW');
    return "interview_requested";
  }
  
  if (/unfortunately|not moving forward|position.*filled|regret|decided not to|other candidate/i.test(fullText)) {
    console.log('Status detected: REJECTED');
    return "rejected";
  }
  
  // Enhanced viewed detection
  if (/viewed|reviewed|looked at|seen your application|application.*viewed|employer.*viewed|recruiter.*viewed/i.test(fullText)) {
    console.log('Status detected: VIEWED');
    return "viewed";
  }
  
  // Check subject specifically for viewed notifications
  if (/viewed/i.test(subject)) {
    console.log('Status detected: VIEWED (from subject)');
    return "viewed";
  }
  
  console.log('Status detected: PENDING');
  return "pending";
}

export function extractLinkedInUrl(text: string): string | undefined {
  // More specific LinkedIn job URL pattern
  const patterns = [
    /https?:\/\/(?:www\.)?linkedin\.com\/jobs\/view\/\d+[^\s<>"']*/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/jobs\/collections\/[^\s<>"']*/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/comm\/jobs\/view\/\d+[^\s<>"']*/gi,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Clean up the URL - remove any trailing characters
      let url = match[0];
      url = url.replace(/[.,;:!?\)\]]+$/, '');  // Remove trailing punctuation
      return url;
    }
  }
  
  return undefined;
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
      
      // Use AI to extract all job information
      const extractedInfo = await extractJobInfoCached(subject, snippet, body, undefined, false);
      
      const { 
        company, 
        position, 
        location, 
        salary, 
        workMode, 
        employmentType,
        linkedinUrl: extractedUrl,
      } = extractedInfo;
      
      const status = detectStatus(subject, snippet, body);
      const applicationDate = new Date(date || Date.now()).toISOString();
      const linkedinUrl = extractedUrl || extractLinkedInUrl(body + ' ' + snippet);
      
      // Create unique key for deduplication
      const key = linkedinUrl || `${company}::${position}`.toLowerCase();
      
      console.log(`Processing email: "${subject.substring(0, 50)}..."`);
      console.log(`  Key: ${key}`);
      console.log(`  Status: ${status}`);
      console.log(`  Existing record: ${appsByKey.has(key) ? 'YES' : 'NO'}`);
      
      const existing = appsByKey.get(key);
      const app: ApplicationRec = existing || {
        id: key,
        company,
        position,
        location: location || "Remote",
        applicationDate,
        status,
        description: subject,
        linkedinUrl,
        salaryRange: salary,
        employmentType,
        workLocation: workMode,
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
        console.log(`  Updating status from ${app.status} to ${status}`);
        app.status = status;
        if (status === "viewed") app.viewDate = applicationDate;
        if (status === "interview_requested" || status === "offer" || status === "rejected") {
          app.responseDate = applicationDate;
        }
      } else {
        console.log(`  Keeping existing status ${app.status} (not updating to ${status})`);
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
  
  // Calculate match scores for all applications
  onProgress?.('Calculating match scores...', 0.9);
  
  const appsWithScores = await Promise.all(apps.map(async (app) => {
    try {
      // Only calculate if we don't have a score already
      if (!app.matchScore) {
        const score = await calculateMatchScore(app);
        return {
          ...app,
          responseRate,
          matchScore: {
            ...score,
            calculatedAt: new Date().toISOString()
          }
        };
      }
      return { ...app, responseRate };
    } catch (error) {
      console.error(`Failed to calculate match score for ${app.company}:`, error);
      return { ...app, responseRate };
    }
  }));

  onProgress?.('Complete!', 1.0);
  return appsWithScores;
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
