import { ApplicationRec } from './types';

// OpenAI API key from environment variable (set in .env.local)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// Steve's resume hardcoded
const USER_RESUME = `
Steve Nahrup
Charleston, SC | (312) 350-6854 | steve.a.nahrup@gmail.com | linkedin.com/in/steve-nahrup | github.com/snahrup

Business Intelligence & AI Leader Profile
Seasoned BI & AI-automation leader with 14 years of enterprise success turning fragmented data into governed, predictive insight. Expert at unifying multi-source datasets in Microsoft Fabric / OneLake, building robust semantic models, and training PySpark notebooks that forecast revenue, demand, and churn. Skilled in orchestrating Synapse Analytics and Data Factory pipelines, harmonizing ERP (SAP / NetSuite) feeds, and deploying LLM-powered workflows with OpenAI & LangChain.

TECHNICAL SKILLS:
Power BI • Microsoft Fabric / OneLake • Synapse Analytics • Data Factory • PySpark Notebooks • ERP (SAP / NetSuite) • dbt / Fivetran • Apache Airflow • n8n • GitHub Actions • OpenAI / LangChain • Pinecone • Python • Predictive Modeling & Forecasting

PROFESSIONAL EXPERIENCE:

STRAINTPRINT TECHNOLOGIES - Toronto, ON, 2025
Consultant | AI Automation Architect
- Consolidated marketing, finance, inventory, and compliance systems onto a single AWS + Power BI backbone
- Designed OpenAI/LangGraph agent frameworks orchestrated in n8n cutting manual hand-offs by 40%
- Refactored legacy reports into governed Power BI semantic models with row-level security, CI/CD
- Implemented ML-based inventory forecasting reducing stockouts by double-digit percentages
- Built Fabric PySpark notebooks for ML models recommending optimal strain/dosage via Direct Lake semantic model

MAYMONT HOMES - Charleston, SC, 2024
Manager | Data Engineering
- Led team of three building unified, cloud-native BI ecosystem from ground up
- Architected comprehensive data models and automated ETL pipelines consolidating diverse sources
- Deployed pipelines using Pentaho, Azure Data Factory, Apache Airflow and Fivetran
- Built predictive models forecasting land/home sale prices over 5-15 year horizons

SENTURUS - Charleston, SC, 2023 to 2024
Practice Director | Microsoft Fabric
- Spearheaded deployment of all Microsoft Fabric and Power BI infrastructure implementations
- Consolidated 30+ source systems into Microsoft Fabric Lakehouses
- Architected comprehensive data governance frameworks for Fabric and Power BI environments
- Established tenant-level settings and workspace roles aligned with enterprise security

INSPIRE11 - Chicago, IL, 2021 to 2023
Consultant | Data Architect
- SME for enterprise BI solutions using Microsoft Azure and Power BI
- Created internal Power BI Knowledge Base reducing onboarding from 2 weeks to 3 days
- Developed 20+ template designs for 10 separate industries

BLUEPRINT DATA CONSULTING - Chicago, IL, 2018 to Present
Managing Director
- Drive operations and consult Strainprint Technologies on global analytics vision
- Oversee AWS cloud architecture ensuring scalability across US, Canada, Australia, Israel

HELLOWORLD, INC. (A MERKLE COMPANY) - Chicago, IL, 2011 to 2018
Director of Business Intelligence, 2017 to 2018
- Led 8-15 member teams of data scientists, account managers and analysts
- Built technical knowledge base and vendor relationships

EDUCATION:
Indiana University, Bloomington - Bachelor of Arts and Science in European History, Minor in Communications
`;

interface MatchScore {
  overall: number;  // 0-100
  skills: number;   // 0-100
  experience: number; // 0-100
  location: number; // 0-100
  salary: number; // 0-100
  reasons: string[];
  suggestions: string[];
}

export async function calculateMatchScore(
  app: ApplicationRec,
  openAIKey?: string,
  userResume?: string,
  userSkills?: string[],
  userPreferences?: any
): Promise<MatchScore> {
  const apiKey = openAIKey || OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'sk-YOUR-API-KEY-HERE') {
    // Return a default score if no API key
    return {
      overall: 0,
      skills: 0,
      experience: 0,
      location: 0,
      salary: 0,
      reasons: ['OpenAI API key not configured'],
      suggestions: ['Add your OpenAI API key in settings to enable AI matching']
    };
  }

  try {
    const prompt = `
      Analyze this job application match for Steve Nahrup:
      
      JOB DETAILS:
      Company: ${app.company}
      Position: ${app.position}
      Location: ${app.location}
      Salary: ${app.salaryRange || 'Not specified'}
      Work Mode: ${app.workLocation || 'Not specified'}
      
      CANDIDATE PROFILE:
      ${USER_RESUME}
      
      Please provide a realistic match analysis in the following JSON format:
      {
        "overall": <0-100 overall match score>,
        "skills": <0-100 skills match score>,
        "experience": <0-100 experience match score>,
        "location": <0-100 location match score>,
        "salary": <0-100 salary match score>,
        "reasons": [<array of 2-3 key reasons for the match score>],
        "suggestions": [<array of 2-3 suggestions to improve candidacy>]
      }
      
      Be realistic and critical in your assessment. Consider:
      - How well Steve's BI/Data/AI skills match the position requirements
      - His 14 years of experience and leadership roles
      - His expertise in Microsoft Fabric, Power BI, Azure, Python, OpenAI
      - Location compatibility (he's in Charleston, SC)
      - Seniority level match (Director/Manager level experience)
      
      Respond ONLY with the JSON object, no additional text.
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
            content: 'You are an expert career advisor and job matching specialist. Provide honest, helpful assessments based on the actual resume provided.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const score = JSON.parse(content);
      return score;
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return getDefaultScore();
    }
  } catch (error) {
    console.error('Error calculating match score:', error);
    return getDefaultScore();
  }
}

function getDefaultScore(): MatchScore {
  return {
    overall: 50,
    skills: 50,
    experience: 50,
    location: 50,
    salary: 50,
    reasons: ['Unable to calculate match score'],
    suggestions: ['Please check your OpenAI API key and try again']
  };
}

// Function to get score color
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400 bg-green-500/20 border-green-500/50';
  if (score >= 60) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
  if (score >= 40) return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
  return 'text-red-400 bg-red-500/20 border-red-500/50';
}

// Function to format score with emoji
export function formatScore(score: number): string {
  if (score >= 80) return `${score}% 🎯`;
  if (score >= 60) return `${score}% 👍`;
  if (score >= 40) return `${score}% 🤔`;
  return `${score}% 👎`;
}
