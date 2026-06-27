import { MasterProfile, GeneratedResumeData, Experience, Leadership, Project, SkillCategory, Certification, SectionName } from '@/types/resume-data';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isSectionHidden(data: GeneratedResumeData, sectionName: SectionName): boolean {
  return data.customizations?.hiddenSections?.includes(sectionName) || false;
}

export function toggleSection(data: GeneratedResumeData, sectionName: SectionName): GeneratedResumeData {
  const hidden = data.customizations?.hiddenSections || [];
  const isHidden = hidden.includes(sectionName);
  return {
    ...data,
    customizations: {
      ...data.customizations,
      hiddenSections: isHidden
        ? hidden.filter((s) => s !== sectionName)
        : [...hidden, sectionName]
    }
  };
}

export function addNewExperience(
  data: GeneratedResumeData,
  masterData: MasterProfile
): { data: GeneratedResumeData; masterData: MasterProfile } {
  const id = generateId();
  const newExperience: Experience = { id, role: 'New Role', company: 'Company', dates: 'Dates', bullets: [''] };
  return {
    data: { ...data, selectedExperiences: [...(data.selectedExperiences || []), id] },
    masterData: { ...masterData, experiences: [...(masterData.experiences || []), newExperience] }
  };
}

export function addNewLeadership(
  data: GeneratedResumeData,
  masterData: MasterProfile
): { data: GeneratedResumeData; masterData: MasterProfile } {
  const id = generateId();
  const newLeadership: Leadership = { id, role: 'New Role', company: 'Organization', dates: 'Dates', bullets: [''] };
  return {
    data: { ...data, selectedLeadership: [...(data.selectedLeadership || []), id] },
    masterData: { ...masterData, leadership: [...(masterData.leadership || []), newLeadership] }
  };
}

export function addNewProject(
  data: GeneratedResumeData,
  masterData: MasterProfile
): { data: GeneratedResumeData; masterData: MasterProfile } {
  const id = generateId();
  const newProject: Project = { id, title: 'New Project', bullets: [''] };
  return {
    data: { ...data, selectedProjects: [...(data.selectedProjects || []), id] },
    masterData: { ...masterData, projects: [...(masterData.projects || []), newProject] }
  };
}

export function addNewSkillCategory(data: GeneratedResumeData): GeneratedResumeData {
  const newCategory: SkillCategory = { category: 'New Category', items: [''] };
  const normalized = normalizeSkills(data.selectedSkills);
  return { ...data, selectedSkills: [...normalized, newCategory] } as GeneratedResumeData;
}

export function addNewCertification(
  data: GeneratedResumeData,
  masterData: MasterProfile
): { data: GeneratedResumeData; masterData: MasterProfile } {
  const newCert: Certification = { name: 'New Certification', details: '' };
  const customCerts = data.customizations?.certifications || [];
  return {
    data: {
      ...data,
      customizations: {
        ...data.customizations,
        certifications: [...customCerts, newCert]
      }
    },
    masterData: { ...masterData, certifications: [...(masterData.certifications || []), newCert] }
  };
}

export function removeItem(
  data: GeneratedResumeData,
  masterData: MasterProfile,
  section: 'experiences' | 'leadership' | 'projects' | 'skills' | 'certifications',
  idOrIndex: string | number
): { data: GeneratedResumeData; masterData: MasterProfile } {
  let newData = { ...data };
  let newMaster = { ...masterData };

  if (section === 'experiences' && typeof idOrIndex === 'string') {
    newData = { ...newData, selectedExperiences: data.selectedExperiences?.filter((id) => id !== idOrIndex) || [] };
    newMaster = { ...newMaster, experiences: masterData.experiences?.filter((e) => e.id !== idOrIndex) || [] };
  } else if (section === 'leadership' && typeof idOrIndex === 'string') {
    newData = { ...newData, selectedLeadership: data.selectedLeadership?.filter((id) => id !== idOrIndex) || [] };
    newMaster = { ...newMaster, leadership: masterData.leadership?.filter((l) => l.id !== idOrIndex) || [] };
  } else if (section === 'projects' && typeof idOrIndex === 'string') {
    newData = { ...newData, selectedProjects: data.selectedProjects?.filter((id) => id !== idOrIndex) || [] };
    newMaster = { ...newMaster, projects: masterData.projects?.filter((p) => p.id !== idOrIndex) || [] };
  } else if (section === 'skills' && typeof idOrIndex === 'number') {
    const normalized = normalizeSkills(data.selectedSkills);
    newData = { ...newData, selectedSkills: normalized.filter((_, i) => i !== idOrIndex) } as GeneratedResumeData;
  } else if (section === 'certifications' && typeof idOrIndex === 'number') {
    const newCerts = data.customizations?.certifications?.filter((_, i) => i !== idOrIndex) || [];
    newData = {
      ...newData,
      customizations: { ...newData.customizations, certifications: newCerts }
    };
    newMaster = { ...newMaster, certifications: masterData.certifications?.filter((_, i) => i !== idOrIndex) || [] };
  }

  return { data: newData, masterData: newMaster };
}

export function moveItem<T>(arr: T[] | undefined, index: number, direction: 'up' | 'down'): T[] {
  if (!arr) return [];
  const newArr = [...arr];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= newArr.length) return newArr;
  [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
  return newArr;
}

export function updateExperience(
  masterData: MasterProfile,
  id: string,
  updates: Partial<Experience>
): MasterProfile {
  return {
    ...masterData,
    experiences: masterData.experiences?.map((e) => (e.id === id ? { ...e, ...updates } : e)) || []
  };
}

export function updateLeadership(
  masterData: MasterProfile,
  id: string,
  updates: Partial<Leadership>
): MasterProfile {
  return {
    ...masterData,
    leadership: masterData.leadership?.map((l) => (l.id === id ? { ...l, ...updates } : l)) || []
  };
}

export function updateProject(
  masterData: MasterProfile,
  id: string,
  updates: Partial<Project>
): MasterProfile {
  return {
    ...masterData,
    projects: masterData.projects?.map((p) => (p.id === id ? { ...p, ...updates } : p)) || []
  };
}

export function updateMasterField<K extends keyof MasterProfile>(
  masterData: MasterProfile,
  field: K,
  value: MasterProfile[K]
): MasterProfile {
  return { ...masterData, [field]: value };
}

export function normalizeSkills(skills: SkillCategory[] | string[] | undefined): SkillCategory[] {
  if (!skills || skills.length === 0) return [];
  if (typeof skills[0] === 'string') {
    return [{ category: 'Skills', items: skills as string[] }];
  }
  return skills as SkillCategory[];
}

export function mergeCustomizationsIntoMaster(
  data: GeneratedResumeData,
  masterData: MasterProfile
): MasterProfile {
  const merged = { ...masterData };
  const adjustments = data.customizations?.bulletPointAdjustments || {};
  const roleAdjustments = data.customizations?.roleAdjustments || {};

  if (merged.experiences) {
    merged.experiences = merged.experiences.map((exp) => {
      const id = exp.id;
      const roleAdj = roleAdjustments[id];
      const bulletAdj = adjustments[id];
      return {
        ...exp,
        ...(roleAdj?.role ? { role: roleAdj.role } : {}),
        ...(roleAdj?.company ? { company: roleAdj.company } : {}),
        ...(bulletAdj ? { bullets: bulletAdj } : {})
      };
    });
  }

  if (merged.leadership) {
    merged.leadership = merged.leadership.map((lead) => {
      const id = lead.id;
      const roleAdj = roleAdjustments[id];
      const bulletAdj = adjustments[id];
      return {
        ...lead,
        ...(roleAdj?.role ? { role: roleAdj.role } : {}),
        ...(roleAdj?.company ? { company: roleAdj.company } : {}),
        ...(bulletAdj ? { bullets: bulletAdj } : {})
      };
    });
  }

  if (merged.projects) {
    merged.projects = merged.projects.map((proj) => {
      const id = proj.id;
      const bulletAdj = adjustments[id];
      return {
        ...proj,
        ...(bulletAdj ? { bullets: bulletAdj } : {})
      };
    });
  }

  return merged;
}
