export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
    headline?: string;
  };
  professionalSummary: string;
  experiences: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    optimizedBullets: string[];
    keywordsUsed?: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    graduationDate: string;
    gpa?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer?: string;
    issueDate?: string;
    credentialId?: string;
    url?: string;
  }>;
  projects?: Array<{
    name: string;
    role?: string;
    url?: string;
    description?: string;
    achievements?: string[];
    technologies?: string[];
  }>;
  languages?: Array<{
    name: string;
    level?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
  keywords?: string[];
}
