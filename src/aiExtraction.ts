import { ApplicationRec } from './types';

// OpenAI API key from environment variable (set in .env.local)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

interface ExtractedJobInfo {
  company: string;
  position: string;
  location: string;
  salary?: string;
  workMode?: 'remote' | 'hybrid' | 'onsite';
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'internship';
  industry?: string;
  companySize?: string;
  requiredSkills?: string[];
  experienceLevel?: string;
  linkedinUrl?: string;
}

export async function extractJobInfoWithAI(
  subject: string,
  snippet: string,
  body: string,
  openAIKey?: string  // Optional parameter, will use hardcoded if not provided
): Promise<ExtractedJobInfo> {
  const apiKey = openAIKey || OPENAI_API_KEY;
  
  // Fallback to basic parsing if no API key
  if (!apiKey || apiKey === 'sk-YOUR-API-KEY-HERE') {
    console.log('No valid OpenAI API key found, using basic parsing');
    return basicParsing(subject, snippet, body);
  }

  // Log what we're processing for debugging
  console.log('=== AI Extraction Debug ===');
  console.log('Subject:', subject.substring(0, 100));
  console.log('Snippet:', snippet.substring(0, 100));

  try {
    const prompt = `
      Extract job application information from this email. Return ONLY a JSON object with the following fields:
      
      EMAIL CONTENT:
      Subject: ${subject}
      Preview: ${snippet}
      Body: ${body.substring(0, 3000)}
      
      IMPORTANT EXTRACTION RULES:
      1. This might be a follow-up email about a job (e.g., "viewed", "interview", etc.)
      2. Extract the ACTUAL company name, not generic terms like "employer" or "recruiter"
      3. Extract the SPECIFIC job title/position
      4. For "viewed" emails, the company and position should match the original application
      5. Look for company names after phrases like "at", "with", "from", or before "viewed"
      6. Look for job titles after "for", "position", "role", or in quotes
      
      REQUIRED JSON FORMAT:
      {
        "company": "Actual company name (required)",
        "position": "Specific job title (required)",
        "location": "City, State or 'Remote' or country",
        "salary": "Salary range if mentioned",
        "workMode": "remote" | "hybrid" | "onsite" (if mentioned),
        "employmentType": "full_time" | "part_time" | "contract" | "internship" (if mentioned),
        "industry": "Industry sector if identifiable",
        "companySize": "Company size if mentioned",
        "requiredSkills": ["skill1", "skill2"],
        "experienceLevel": "Senior" | "Mid" | "Junior" | "Entry" (if identifiable),
        "linkedinUrl": "LinkedIn job posting URL if present"
      }
      
      Examples of correct extraction:
      - "Akkodis viewed your application" → company: "Akkodis"
      - "Your application for MS Fabric Data Specialist" → position: "MS Fabric Data Specialist"
      - "Application viewed by employer at Google" → company: "Google"
      
      Return ONLY the JSON object, no explanation.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting structured job information from emails. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return basicParsing(subject, snippet, body);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Clean the response in case there's markdown formatting
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const extracted = JSON.parse(cleanedContent);
      
      // Ensure we have at least company and position
      if (!extracted.company || extracted.company === 'Unknown Company') {
        extracted.company = extractCompanyFallback(subject, snippet);
      }
      if (!extracted.position || extracted.position === 'Unknown Position') {
        extracted.position = extractPositionFallback(subject, snippet, body);
      }
      
      console.log('AI Extracted:', {
        company: extracted.company,
        position: extracted.position,
        location: extracted.location
      });
      console.log('Key will be:', extracted.linkedinUrl || `${extracted.company}::${extracted.position}`.toLowerCase());
      
      return extracted;
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return basicParsing(subject, snippet, body);
    }
  } catch (error) {
    console.error('Error using AI extraction:', error);
    return basicParsing(subject, snippet, body);
  }
}

// Basic fallback parsing when AI is not available
function basicParsing(subject: string, snippet: string, body: string): ExtractedJobInfo {
  const fullText = `${subject} ${snippet} ${body}`.substring(0, 2000);
  
  // Try to extract company
  let company = 'Unknown Company';
  const companyMatch = fullText.match(/(?:application was sent to|viewed your application|at company:?)\s+([^,\.\n]+)/i);
  if (companyMatch) {
    company = companyMatch[1].trim();
  }
  
  // Try to extract position
  let position = 'Unknown Position';
  const positionMatch = fullText.match(/(?:position:|role:|job title:|for position)\s*([^,\.\n]+)/i);
  if (positionMatch) {
    position = positionMatch[1].trim();
  }
  
  // Try to extract location
  let location = 'Remote';
  const locationMatch = fullText.match(/(?:location:|based in|office:)\s*([^,\.\n]+)/i);
  if (locationMatch) {
    location = locationMatch[1].trim();
  }
  
  // Extract LinkedIn URL
  let linkedinUrl;
  const urlMatch = fullText.match(/https?:\/\/(?:www\.)?linkedin\.com\/jobs\/view\/\d+[^\s<>"']*/i);
  if (urlMatch) {
    linkedinUrl = urlMatch[0];
  }
  
  return {
    company,
    position,
    location,
    linkedinUrl
  };
}

function extractCompanyFallback(subject: string, snippet: string): string {
  const text = `${subject} ${snippet}`;
  const patterns = [
    /sent to\s+([^,\.\n]+)/i,
    /^([^:]+?)\s+viewed/i,
    /at\s+([A-Z][A-Za-z0-9\s&]+)/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return 'Unknown Company';
}

function extractPositionFallback(subject: string, snippet: string, body: string): string {
  const text = `${subject} ${snippet} ${body}`.substring(0, 1000);
  
  // Common job title patterns
  const patterns = [
    /(?:Senior|Junior|Lead|Principal|Staff)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/,
    /(?:Software|Data|Product|Business|Marketing)\s+(?:Engineer|Manager|Analyst|Developer|Scientist)/i,
    /(?:Director|VP|Head)\s+of\s+[A-Z][a-z]+/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  return 'Unknown Position';
}

// Cache for API calls to avoid re-processing the same email
const extractionCache = new Map<string, ExtractedJobInfo>();

// Function to clear the extraction cache (useful for debugging/reprocessing)
export function clearExtractionCache() {
  extractionCache.clear();
  console.log('AI extraction cache cleared - all emails will be reprocessed');
}

export async function extractJobInfoCached(
  subject: string,
  snippet: string,
  body: string,
  openAIKey?: string,  // Optional, will use hardcoded if not provided
  forceRefresh: boolean = false  // Force reprocessing even if cached
): Promise<ExtractedJobInfo> {
  const cacheKey = `${subject}::${snippet.substring(0, 100)}`;
  
  // Check cache only if not forcing refresh
  if (!forceRefresh && extractionCache.has(cacheKey)) {
    console.log('Using cached extraction for:', subject.substring(0, 50));
    return extractionCache.get(cacheKey)!;
  }
  
  console.log('Processing with AI:', subject.substring(0, 50));
  const result = await extractJobInfoWithAI(subject, snippet, body, openAIKey);
  extractionCache.set(cacheKey, result);
  
  return result;
}
