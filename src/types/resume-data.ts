export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
}

export interface Education {
  degree?: string;
  institution?: string;
  dates?: string;
  focus?: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  dates: string;
  bullets: string[];
}

export interface Leadership {
  id: string;
  role: string;
  company: string;
  dates: string;
  bullets: string[];
}

export interface Project {
  id: string;
  title: string;
  bullets: string[];
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface Certification {
  name: string;
  details?: string;
}

export interface MasterProfile {
  personalInfo?: PersonalInfo;
  education?: Education;
  experiences?: Experience[];
  leadership?: Leadership[];
  projects?: Project[];
  skills?: SkillCategory[] | string[];
  certifications?: Certification[];
  achievements?: any[];
  hobbies?: any[];
}

export interface RoleAdjustment {
  role?: string;
  company?: string;
}

export interface ResumeCustomizations {
  headerTitle?: string;
  summary?: string | null;
  educationFocus?: string;
  bulletPointAdjustments?: Record<string, string[]>;
  roleAdjustments?: Record<string, RoleAdjustment>;
  hiddenSections?: string[];
  certifications?: Certification[];
}

export interface GeneratedResumeData {
  resumeName?: string;
  selectedExperiences?: string[];
  selectedLeadership?: string[];
  selectedProjects?: string[];
  selectedSkills?: SkillCategory[] | string[];
  customizations?: ResumeCustomizations;
}

export interface GeneratedResume {
  id: string;
  name: string;
  data: GeneratedResumeData;
  masterData: MasterProfile;
  jobDescription?: string;
  preferences?: any;
  createdAt: string;
  updatedAt: string;
}

export type SectionName = 'summary' | 'education' | 'experience' | 'leadership' | 'projects' | 'skills' | 'certifications';
