'use client';

import { useState } from 'react';
import { MasterProfile, GeneratedResumeData, SectionName } from '@/types/resume-data';
import {
  addNewExperience,
  addNewLeadership,
  addNewProject,
  addNewSkillCategory,
  addNewCertification,
  removeItem,
  moveItem,
  updateExperience,
  updateLeadership,
  updateProject,
  updateMasterField,
  toggleSection,
  isSectionHidden,
  normalizeSkills
} from '@/lib/resume-editor-helpers';
import ResumeEditorItem from './ResumeEditorItem';
import ResumeEditorSkills from './ResumeEditorSkills';
import ResumeEditorCertifications from './ResumeEditorCertifications';

interface Props {
  data: GeneratedResumeData;
  masterData: MasterProfile;
  onChange: (data: GeneratedResumeData, masterData: MasterProfile) => void;
}

export default function ResumeEditor({ data, masterData, onChange }: Props) {
  const setData = (newData: GeneratedResumeData) => onChange(newData, masterData);
  const setMasterData = (newMasterData: MasterProfile) => onChange(data, newMasterData);
  const setBoth = (newData: GeneratedResumeData, newMasterData: MasterProfile) => onChange(newData, newMasterData);

  const hidden = data.customizations?.hiddenSections || [];
  const toggle = (name: SectionName) => setData(toggleSection(data, name));

  const sectionToggle = (name: SectionName) => (
    <button
      onClick={() => toggle(name)}
      style={{
        padding: '4px 10px',
        borderRadius: '6px',
        border: '1px solid var(--line)',
        background: hidden.includes(name) ? '#a8645b' : 'var(--accent)',
        color: 'white',
        cursor: 'pointer',
        fontSize: '12px'
      }}
      title={hidden.includes(name) ? 'Show section' : 'Hide section'}
    >
      {hidden.includes(name) ? '➕ Show' : '✓ Hide'}
    </button>
  );

  return (
    <div className="resume-editor" style={{ flex: '1 1 480px', minWidth: '480px', height: 'calc(100vh - 120px)', overflowY: 'auto', padding: '32px', background: 'transparent' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', color: 'var(--text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Edit Resume</h2>

      {/* Header */}
      <EditorSection title="Header" alwaysVisible>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            value={masterData.personalInfo?.name || ''}
            onChange={(e) => setMasterData(updateMasterField(masterData, 'personalInfo', { ...masterData.personalInfo, name: e.target.value }))}
            style={inputStyle}
            placeholder="Full name"
          />
          <input
            type="text"
            value={data.customizations?.headerTitle || ''}
            onChange={(e) => setData({ ...data, customizations: { ...data.customizations, headerTitle: e.target.value } })}
            style={inputStyle}
            placeholder="Title / headline"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              value={masterData.personalInfo?.email || ''}
              onChange={(e) => setMasterData(updateMasterField(masterData, 'personalInfo', { ...masterData.personalInfo, email: e.target.value }))}
              style={inputStyle}
              placeholder="Email"
            />
            <input
              type="text"
              value={masterData.personalInfo?.phone || ''}
              onChange={(e) => setMasterData(updateMasterField(masterData, 'personalInfo', { ...masterData.personalInfo, phone: e.target.value }))}
              style={inputStyle}
              placeholder="Phone"
            />
          </div>
          <input
            type="text"
            value={masterData.personalInfo?.location || ''}
            onChange={(e) => setMasterData(updateMasterField(masterData, 'personalInfo', { ...masterData.personalInfo, location: e.target.value }))}
            style={inputStyle}
            placeholder="Location"
          />
        </div>
      </EditorSection>

      {/* Summary */}
      <EditorSection title="Summary" action={sectionToggle('summary')}>
        {!isSectionHidden(data, 'summary') && (
          <textarea
            value={data.customizations?.summary ?? masterData.personalInfo?.summary ?? ''}
            onChange={(e) => setData({ ...data, customizations: { ...data.customizations, summary: e.target.value } })}
            rows={6}
            style={{ ...inputStyle, width: '100%', minHeight: '120px', resize: 'none' }}
            placeholder="Professional summary"
          />
        )}
      </EditorSection>

      {/* Education */}
      <EditorSection title="Education" action={sectionToggle('education')}>
        {!isSectionHidden(data, 'education') && masterData.education && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              value={masterData.education.degree || ''}
              onChange={(e) => setMasterData(updateMasterField(masterData, 'education', { ...masterData.education, degree: e.target.value }))}
              style={inputStyle}
              placeholder="Degree"
            />
            <input
              type="text"
              value={masterData.education.institution || ''}
              onChange={(e) => setMasterData(updateMasterField(masterData, 'education', { ...masterData.education, institution: e.target.value }))}
              style={inputStyle}
              placeholder="Institution"
            />
            <input
              type="text"
              value={masterData.education.dates || ''}
              onChange={(e) => setMasterData(updateMasterField(masterData, 'education', { ...masterData.education, dates: e.target.value }))}
              style={inputStyle}
              placeholder="Dates"
            />
            <input
              type="text"
              value={data.customizations?.educationFocus || masterData.education.focus || ''}
              onChange={(e) => setData({ ...data, customizations: { ...data.customizations, educationFocus: e.target.value } })}
              style={inputStyle}
              placeholder="Focus (e.g., Product Strategy & Data)"
            />
          </div>
        )}
      </EditorSection>

      {/* Experience */}
      <EditorSection title="Experience" action={sectionToggle('experience')}>
        {!isSectionHidden(data, 'experience') && (
          <>
            {data.selectedExperiences?.map((id, index) => {
              const exp = masterData.experiences?.find((e) => e.id === id);
              if (!exp) return null;
              return (
                <ResumeEditorItem
                  key={id}
                  item={exp}
                  sectionType="experience"
                  onChange={(updates) => setMasterData(updateExperience(masterData, id, updates))}
                  onMove={(dir) => {
                    const ids = moveItem(data.selectedExperiences, index, dir);
                    setData({ ...data, selectedExperiences: ids });
                  }}
                  onDelete={() => {
                    const { data: newData, masterData: newMaster } = removeItem(data, masterData, 'experiences', id);
                    setBoth(newData, newMaster);
                  }}
                  canMoveUp={index > 0}
                  canMoveDown={index < (data.selectedExperiences?.length || 0) - 1}
                />
              );
            })}
            <button onClick={() => { const result = addNewExperience(data, masterData); setBoth(result.data, result.masterData); }} style={addBtn}>➕ Add experience</button>
          </>
        )}
      </EditorSection>

      {/* Leadership */}
      <EditorSection title="Leadership" action={sectionToggle('leadership')}>
        {!isSectionHidden(data, 'leadership') && (
          <>
            {data.selectedLeadership?.map((id, index) => {
              const lead = masterData.leadership?.find((l) => l.id === id);
              if (!lead) return null;
              return (
                <ResumeEditorItem
                  key={id}
                  item={lead}
                  sectionType="leadership"
                  onChange={(updates) => setMasterData(updateLeadership(masterData, id, updates))}
                  onMove={(dir) => {
                    const ids = moveItem(data.selectedLeadership, index, dir);
                    setData({ ...data, selectedLeadership: ids });
                  }}
                  onDelete={() => {
                    const { data: newData, masterData: newMaster } = removeItem(data, masterData, 'leadership', id);
                    setBoth(newData, newMaster);
                  }}
                  canMoveUp={index > 0}
                  canMoveDown={index < (data.selectedLeadership?.length || 0) - 1}
                />
              );
            })}
            <button onClick={() => { const result = addNewLeadership(data, masterData); setBoth(result.data, result.masterData); }} style={addBtn}>➕ Add leadership</button>
          </>
        )}
      </EditorSection>

      {/* Projects */}
      <EditorSection title="Projects" action={sectionToggle('projects')}>
        {!isSectionHidden(data, 'projects') && (
          <>
            {data.selectedProjects?.map((id, index) => {
              const proj = masterData.projects?.find((p) => p.id === id);
              if (!proj) return null;
              return (
                <ResumeEditorItem
                  key={id}
                  item={proj}
                  sectionType="project"
                  onChange={(updates) => setMasterData(updateProject(masterData, id, updates))}
                  onMove={(dir) => {
                    const ids = moveItem(data.selectedProjects, index, dir);
                    setData({ ...data, selectedProjects: ids });
                  }}
                  onDelete={() => {
                    const { data: newData, masterData: newMaster } = removeItem(data, masterData, 'projects', id);
                    setBoth(newData, newMaster);
                  }}
                  canMoveUp={index > 0}
                  canMoveDown={index < (data.selectedProjects?.length || 0) - 1}
                />
              );
            })}
            <button onClick={() => { const result = addNewProject(data, masterData); setBoth(result.data, result.masterData); }} style={addBtn}>➕ Add project</button>
          </>
        )}
      </EditorSection>

      {/* Skills */}
      <EditorSection title="Skills" action={sectionToggle('skills')}>
        {!isSectionHidden(data, 'skills') && (
          <>
            <ResumeEditorSkills
              skills={normalizeSkills(data.selectedSkills)}
              onChange={(skills) => setData({ ...data, selectedSkills: skills })}
            />
            <button onClick={() => setData(addNewSkillCategory(data))} style={addBtn}>➕ Add skill category</button>
          </>
        )}
      </EditorSection>

      {/* Certifications */}
      <EditorSection title="Certifications" action={sectionToggle('certifications')}>
        {!isSectionHidden(data, 'certifications') && (
          <>
            <ResumeEditorCertifications
              certifications={data.customizations?.certifications || masterData.certifications || []}
              onChange={(certs) => setData({ ...data, customizations: { ...data.customizations, certifications: certs } })}
            />
            <button
              onClick={() => {
                const { data: newData, masterData: newMaster } = addNewCertification(data, masterData);
                setBoth(newData, newMaster);
              }}
              style={addBtn}
            >
              ➕ Add certification
            </button>
          </>
        )}
      </EditorSection>

      <style jsx>{`
        .resume-editor::-webkit-scrollbar {
          width: 6px;
        }
        .resume-editor::-webkit-scrollbar-track {
          background: transparent;
        }
        .resume-editor::-webkit-scrollbar-thumb {
          background: var(--line);
          border-radius: 3px;
        }
        .resume-editor::-webkit-scrollbar-thumb:hover {
          background: var(--muted);
        }
      `}</style>
    </div>
  );
}

function EditorSection({ title, children, action, alwaysVisible }: { title: string; children: React.ReactNode; action?: React.ReactNode; alwaysVisible?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
          {open ? '▼' : '▶'} {title}
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {action}
        </div>
      </div>
      {open && children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: '14px',
  lineHeight: '1.5'
};

const addBtn: React.CSSProperties = {
  marginTop: '12px',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px dashed var(--line)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: '13px',
  width: '100%',
  fontWeight: 500
};
