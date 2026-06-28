'use client';

import { useState } from 'react';

export default function ProfileEditor({ data, onChange }: { data: any; onChange: (data: any) => void }) {
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [skillGenerationError, setSkillGenerationError] = useState<string | null>(null);
  const [isParsingCareerGoals, setIsParsingCareerGoals] = useState(false);
  const [careerGoalsError, setCareerGoalsError] = useState<string | null>(null);
  const [careerGoalsSuccess, setCareerGoalsSuccess] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [dedupSuccess, setDedupSuccess] = useState<string | null>(null);
  const updateField = (section: string, field: string, value: any) => {
    onChange({
      ...data,
      [section]: {
        ...data[section],
        [field]: value
      }
    });
  };

  const updateArrayItem = (section: string, index: number, field: string, value: any) => {
    const newArray = [...data[section]];
    newArray[index] = {
      ...newArray[index],
      [field]: value
    };
    onChange({
      ...data,
      [section]: newArray
    });
  };

  const deleteArrayItem = (section: string, index: number) => {
    const newArray = [...data[section]];
    newArray.splice(index, 1);
    onChange({
      ...data,
      [section]: newArray
    });
  };

  const addExperience = () => {
    const timestamp = Date.now();
    const newExperiences = [...(data.experiences || []), {
      id: `experience-${timestamp}`,
      role: '',
      company: '',
      dates: '',
      bullets: ['']
    }];
    onChange({ ...data, experiences: newExperiences });
  };

  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      const response = await fetch('/api/profile/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: data }),
      });
      if (!response.ok) throw new Error('Failed to generate summary');
      const result = await response.json();
      if (result.professionalSummary) {
        onChange({
          ...data,
          personalInfo: { ...data.personalInfo, summary: result.professionalSummary },
          ...(result.backgroundBrief && !data.personalContext?.trim()
            ? { personalContext: result.backgroundBrief }
            : {}),
        });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryError('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const generateSkills = async () => {
    setIsGeneratingSkills(true);
    setSkillGenerationError(null);

    try {
      const response = await fetch('/api/profile/generate-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: data }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate skills');
      }

      const result = await response.json();
      
      // Update skills in the profile data
      onChange({ ...data, skills: result.skills });
      
    } catch (error) {
      console.error('Error generating skills:', error);
      setSkillGenerationError('Failed to generate skills. Please try again.');
    } finally {
      setIsGeneratingSkills(false);
    }
  };

  const deduplicateProfile = () => {
    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const dedup = (arr: any[], keyA: string, keyB: string) => {
      const result: any[] = [];
      (arr || []).forEach((item) => {
        const nA = norm(item[keyA] || '');
        const nB = norm(item[keyB] || '');
        const idx = result.findIndex((ex) => {
          const eA = norm(ex[keyA] || '');
          const eB = norm(ex[keyB] || '');
          return (nA && eA && (eA.includes(nA) || nA.includes(eA))) ||
                 (nB && eB && (eB.includes(nB) || nB.includes(eB)));
        });
        if (idx >= 0) {
          const seen = new Set(result[idx].bullets || []);
          (item.bullets || []).forEach((b: string) => { if (!seen.has(b)) result[idx].bullets.push(b); });
        } else {
          result.push({ ...item, bullets: [...(item.bullets || [])] });
        }
      });
      return result;
    };
    const cleaned = {
      ...data,
      experiences: Array.isArray(data.experiences) ? dedup(data.experiences, 'company', 'role') : data.experiences,
      leadership: Array.isArray(data.leadership) ? dedup(data.leadership, 'company', 'role') : data.leadership,
      projects: Array.isArray(data.projects) ? dedup(data.projects, 'title', 'title') : data.projects,
    };
    const removed =
      ((data.experiences?.length || 0) - (cleaned.experiences?.length || 0)) +
      ((data.leadership?.length || 0) - (cleaned.leadership?.length || 0)) +
      ((data.projects?.length || 0) - (cleaned.projects?.length || 0));
    onChange(cleaned);
    setDedupSuccess(removed > 0 ? `Merged ${removed} duplicate entr${removed === 1 ? 'y' : 'ies'}.` : 'No duplicates found.');
    setTimeout(() => setDedupSuccess(null), 4000);
  };

  const parseCareerGoals = async () => {
    if (!data.personalContext || data.personalContext.trim().length < 20) {
      setCareerGoalsError('Please add some context first — paste your ChatGPT memories, career notes, or anything about your background.');
      return;
    }

    setIsParsingCareerGoals(true);
    setCareerGoalsError(null);
    setCareerGoalsSuccess(null);

    try {
      const response = await fetch('/api/profile/parse-career-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          careerGoalsText: data.personalContext,
          existingProfile: data 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse career goals');
      }

      const result = await response.json();
      const { extractedData } = result;

      // Merge extracted data with existing profile
      const mergedData = { ...data };

      const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
      const autoMerge = (existing: any[], added: any[], keyA: string, keyB: string) => {
        const result = existing.map((e) => ({ ...e, bullets: [...(e.bullets || [])] }));
        added.forEach((newItem) => {
          const nA = norm(newItem[keyA] || '');
          const nB = norm(newItem[keyB] || '');
          const idx = result.findIndex((ex) => {
            const eA = norm(ex[keyA] || '');
            const eB = norm(ex[keyB] || '');
            return (nA && eA && (eA.includes(nA) || nA.includes(eA))) ||
                   (nB && eB && (eB.includes(nB) || nB.includes(eB)));
          });
          if (idx >= 0) {
            const seen = new Set(result[idx].bullets);
            (newItem.bullets || []).forEach((b: string) => { if (!seen.has(b)) result[idx].bullets.push(b); });
          } else {
            result.push({ ...newItem, id: newItem.id || `merged-${Date.now()}-${Math.random().toString(36).slice(2)}` });
          }
        });
        return result;
      };

      if (extractedData.experiences?.length) {
        mergedData.experiences = autoMerge(data.experiences || [], extractedData.experiences, 'company', 'role');
      }
      if (extractedData.leadership?.length) {
        mergedData.leadership = autoMerge(data.leadership || [], extractedData.leadership, 'company', 'role');
      }
      if (extractedData.projects?.length) {
        mergedData.projects = autoMerge(data.projects || [], extractedData.projects, 'title', 'title');
      }
      if (extractedData.education?.length) {
        mergedData.education = autoMerge(data.education || [], extractedData.education, 'school', 'degree');
      }

      // Merge skills — extracted are plain strings; existing are {category, items} objects
      if (extractedData.skills && extractedData.skills.length > 0) {
        const existingSkillNames = new Set(
          (data.skills || []).flatMap((s: any) =>
            typeof s === 'string' ? [s.toLowerCase()] : (s.items || []).map((i: string) => i.toLowerCase())
          )
        );
        const newSkills = extractedData.skills
          .filter((s: any) => typeof s === 'string')
          .filter((s: string) => !existingSkillNames.has(s.toLowerCase()));
        if (newSkills.length > 0) {
          // Add as a new category object to match the existing skill structure
          const newCategory = { category: 'From Context', items: newSkills };
          mergedData.skills = [...(data.skills || []), newCategory];
        }
      }

      // Merge certifications — extracted are plain strings; existing are {name, details} objects
      if (extractedData.certifications && extractedData.certifications.length > 0) {
        const existingCertNames = new Set(
          (data.certifications || []).map((c: any) =>
            (typeof c === 'string' ? c : c.name || '').toLowerCase()
          )
        );
        const newCerts = extractedData.certifications
          .filter((c: any) => typeof c === 'string')
          .filter((c: string) => !existingCertNames.has(c.toLowerCase()))
          .map((c: string) => ({ name: c, details: '' }));
        if (newCerts.length > 0) {
          mergedData.certifications = [...(data.certifications || []), ...newCerts];
        }
      }

      onChange(mergedData);
      setCareerGoalsSuccess('Extracted and merged new info into your profile. Duplicate entries were automatically combined.');
      
    } catch (error) {
      console.error('Error parsing career goals:', error);
      setCareerGoalsError('Failed to parse career goals. Please try again.');
    } finally {
      setIsParsingCareerGoals(false);
    }
  };

  const addLeadership = () => {
    const timestamp = Date.now();
    const newLeadership = [...(data.leadership || []), {
      id: `leadership-${timestamp}`,
      role: '',
      company: '',
      dates: '',
      bullets: ['']
    }];
    onChange({ ...data, leadership: newLeadership });
  };

  const addProject = () => {
    const timestamp = Date.now();
    const newProjects = [...(data.projects || []), {
      id: `project-${timestamp}`,
      title: '',
      description: '',
      bullets: []
    }];
    onChange({ ...data, projects: newProjects });
  };

  const updateBullet = (section: string, itemIndex: number, bulletIndex: number, value: string) => {
    const newArray = [...data[section]];
    const newBullets = [...newArray[itemIndex].bullets];
    newBullets[bulletIndex] = value;
    newArray[itemIndex] = {
      ...newArray[itemIndex],
      bullets: newBullets
    };
    onChange({
      ...data,
      [section]: newArray
    });
  };

  const addBullet = (section: string, itemIndex: number) => {
    const newArray = [...data[section]];
    newArray[itemIndex] = {
      ...newArray[itemIndex],
      bullets: [...newArray[itemIndex].bullets, '']
    };
    onChange({
      ...data,
      [section]: newArray
    });
  };

  const removeBullet = (section: string, itemIndex: number, bulletIndex: number) => {
    const newArray = [...data[section]];
    const newBullets = newArray[itemIndex].bullets.filter((_: any, i: number) => i !== bulletIndex);
    newArray[itemIndex] = {
      ...newArray[itemIndex],
      bullets: newBullets
    };
    onChange({
      ...data,
      [section]: newArray
    });
  };

  return (
    <div className="profile-editor">
      <div className="editor-section">
        <div className="section-header">
          <span className="section-icon">✨</span>
          <h4>Personal Context & Background</h4>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '12px' }}>
          Dump anything here: ChatGPT memories, career notes, your story, target roles, what makes you stand out. 
          Click <strong>Extract Info</strong> and the AI will pull out structured data (skills, experiences, projects, goals) and merge it into your profile.
        </p>
        <div className="form-group">
          <label>Context Dump</label>
          <textarea
            value={data.personalContext || ''}
            onChange={(e) => onChange({ ...data, personalContext: e.target.value })}
            rows={6}
            placeholder="Example: I'm targeting Product Manager roles in fintech. I founded PitchIQ, an AI-powered sales training platform where I translated 60+ customer conversations into product decisions. I want to emphasize my product thinking, user insight skills, and ability to build in fast-paced environments. My strongest leverage is my hands-on experience building products from 0→1."
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={parseCareerGoals}
            disabled={isParsingCareerGoals || !data.personalContext || data.personalContext.trim().length < 20}
            className="button-secondary"
          >
            {isParsingCareerGoals ? 'Extracting Info...' : 'Extract Info & Update Profile'}
          </button>
          <button
            onClick={deduplicateProfile}
            className="button-secondary"
          >
            Clean Up Duplicates
          </button>
        </div>
        {dedupSuccess && (
          <div style={{ color: 'var(--success)', fontSize: '14px', marginTop: '8px' }}>
            ✓ {dedupSuccess}
          </div>
        )}
        {careerGoalsError && (
          <div style={{ color: 'var(--error)', fontSize: '14px', marginTop: '8px' }}>
            {careerGoalsError}
          </div>
        )}
        {careerGoalsSuccess && (
          <div style={{ color: 'var(--success)', fontSize: '14px', marginTop: '8px' }}>
            ✓ {careerGoalsSuccess}
          </div>
        )}
      </div>

      <div className="editor-section">
        <div className="section-header">
          <span className="section-icon">👤</span>
          <h4>Personal Information</h4>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={data.personalInfo?.name || ''}
              onChange={(e) => updateField('personalInfo', 'name', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Pronouns</label>
            <input
              type="text"
              value={data.personalInfo?.pronouns || ''}
              onChange={(e) => updateField('personalInfo', 'pronouns', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={data.personalInfo?.email || ''}
              onChange={(e) => updateField('personalInfo', 'email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={data.personalInfo?.phone || ''}
              onChange={(e) => updateField('personalInfo', 'phone', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={data.personalInfo?.location || ''}
              onChange={(e) => updateField('personalInfo', 'location', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>LinkedIn</label>
            <input
              type="text"
              value={data.personalInfo?.linkedin || ''}
              onChange={(e) => updateField('personalInfo', 'linkedin', e.target.value)}
            />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ marginBottom: 0 }}>Professional Thesis</label>
              <button
                onClick={generateSummary}
                disabled={isGeneratingSummary}
                className="button-secondary"
                style={{ fontSize: '12px', padding: '4px 12px' }}
              >
                {isGeneratingSummary ? '✨ Generating...' : '✨ AI Generate'}
              </button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>
              Your positioning statement — not a summary of your resume, but the thesis that frames everything below it. Click <strong>AI Generate</strong> to craft one from your profile data.
            </p>
            <textarea
              value={data.personalInfo?.summary || ''}
              onChange={(e) => updateField('personalInfo', 'summary', e.target.value)}
              rows={3}
              placeholder="Upload your resume or click ✨ AI Generate above — the AI will craft a sharp positioning statement from your actual experiences and achievements."
            />
            {summaryError && <div style={{ color: 'var(--error)', fontSize: '13px', marginTop: '6px' }}>{summaryError}</div>}
          </div>
        </div>
      </div>

      <div className="editor-section">
        <div className="section-header">
          <span className="section-icon">🎓</span>
          <h4>Education</h4>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Degree</label>
            <input
              type="text"
              value={data.education?.degree || ''}
              onChange={(e) => updateField('education', 'degree', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Institution</label>
            <input
              type="text"
              value={data.education?.institution || ''}
              onChange={(e) => updateField('education', 'institution', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Dates</label>
            <input
              type="text"
              value={data.education?.dates || ''}
              onChange={(e) => updateField('education', 'dates', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Focus</label>
            <input
              type="text"
              value={data.education?.focus || ''}
              onChange={(e) => updateField('education', 'focus', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="editor-section">
        <div className="section-header">
          <span className="section-icon">💼</span>
          <h4>Work Experience</h4>
        </div>
        {data.experiences && data.experiences.length > 0 ? (
          data.experiences.map((exp: any, i: number) => (
            <div key={i} className="experience-item">
              <button
                onClick={() => deleteArrayItem('experiences', i)}
                className="delete-item-btn"
                title="Delete this experience"
              >
                ✕
              </button>
              <div className="form-grid">
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={exp.role || ''}
                    onChange={(e) => updateArrayItem('experiences', i, 'role', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={exp.company || ''}
                    onChange={(e) => updateArrayItem('experiences', i, 'company', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Dates</label>
                  <input
                    type="text"
                    value={exp.dates || ''}
                    onChange={(e) => updateArrayItem('experiences', i, 'dates', e.target.value)}
                  />
                </div>
              </div>
              <div className="bullets-section">
                <label>Achievements</label>
                {exp.bullets?.map((bullet: string, j: number) => (
                  <div key={j} className="bullet-input">
                    <textarea
                      value={bullet}
                      onChange={(e) => updateBullet('experiences', i, j, e.target.value)}
                      rows={2}
                    />
                    <button
                      onClick={() => removeBullet('experiences', i, j)}
                      className="remove-bullet"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addBullet('experiences', i)}
                  className="add-bullet-btn"
                >
                  + Add Achievement
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--muted)', marginBottom: '12px' }}>No experiences added yet.</p>
        )}
        <button
          onClick={addExperience}
          className="add-bullet-btn"
        >
          + Add Experience
        </button>
      </div>

      <div className="editor-section">
        <div className="section-header">
          <span className="section-icon">⭐</span>
          <h4>Leadership</h4>
        </div>
        {data.leadership && data.leadership.length > 0 ? (
          data.leadership.map((lead: any, i: number) => (
            <div key={i} className="experience-item">
              <button
                onClick={() => deleteArrayItem('leadership', i)}
                className="delete-item-btn"
                title="Delete this leadership role"
              >
                ✕
              </button>
              <div className="form-grid">
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={lead.role || ''}
                    onChange={(e) => updateArrayItem('leadership', i, 'role', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Organization</label>
                  <input
                    type="text"
                    value={lead.company || ''}
                    onChange={(e) => updateArrayItem('leadership', i, 'company', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Dates</label>
                  <input
                    type="text"
                    value={lead.dates || ''}
                    onChange={(e) => updateArrayItem('leadership', i, 'dates', e.target.value)}
                  />
                </div>
              </div>
              <div className="bullets-section">
                <label>Achievements</label>
                {lead.bullets?.map((bullet: string, j: number) => (
                  <div key={j} className="bullet-input">
                    <textarea
                      value={bullet}
                      onChange={(e) => updateBullet('leadership', i, j, e.target.value)}
                      rows={2}
                    />
                    <button
                      onClick={() => removeBullet('leadership', i, j)}
                      className="remove-bullet"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addBullet('leadership', i)}
                  className="add-bullet-btn"
                >
                  + Add Achievement
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--muted)', marginBottom: '12px' }}>No leadership roles added yet.</p>
        )}
        <button
          onClick={addLeadership}
          className="add-bullet-btn"
        >
          + Add Leadership Role
        </button>
      </div>

      <div className="editor-section">
        <div className="section-header">
          <span className="section-icon">🚀</span>
          <h4>Projects</h4>
        </div>
        {data.projects && data.projects.length > 0 ? (
          data.projects.map((proj: any, i: number) => (
            <div key={i} className="experience-item">
              <button
                onClick={() => deleteArrayItem('projects', i)}
                className="delete-item-btn"
                title="Delete this project"
              >
                ✕
              </button>
              <div className="form-grid">
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={proj.title || ''}
                    onChange={(e) => updateArrayItem('projects', i, 'title', e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <textarea
                    value={proj.description || ''}
                    onChange={(e) => updateArrayItem('projects', i, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              {proj.bullets && proj.bullets.length > 0 && (
                <div className="bullets-section">
                  <label>Details</label>
                  {proj.bullets.map((bullet: string, j: number) => (
                    <div key={j} className="bullet-input">
                      <textarea
                        value={bullet}
                        onChange={(e) => updateBullet('projects', i, j, e.target.value)}
                        rows={2}
                      />
                      <button
                        onClick={() => removeBullet('projects', i, j)}
                        className="remove-bullet"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addBullet('projects', i)}
                    className="add-bullet-btn"
                  >
                    + Add Detail
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--muted)', marginBottom: '12px' }}>No projects added yet.</p>
        )}
        <button
          onClick={addProject}
          className="add-bullet-btn"
        >
          + Add Project
        </button>
      </div>

      {data.skills && data.skills.length > 0 && (
        <div className="editor-section">
          <div className="section-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="section-icon">⚡</span>
              <h4>Skills & Tools</h4>
            </div>
            <button
              onClick={generateSkills}
              disabled={isGeneratingSkills}
              className="add-bullet-btn"
              style={{ 
                margin: 0,
                background: 'rgba(139, 94, 60, 0.08)',
                borderColor: 'rgba(139, 94, 60, 0.25)',
                color: '#8b5e3c'
              }}
            >
              {isGeneratingSkills ? '✨ Generating...' : '✨ AI Generate Skills'}
            </button>
          </div>
          {skillGenerationError && (
            <p style={{ 
              color: '#a8645b', 
              fontSize: '13px', 
              marginBottom: '12px',
              padding: '8px',
              background: 'rgba(168, 100, 91, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(168, 100, 91, 0.3)'
            }}>
              {skillGenerationError}
            </p>
          )}
          {data.skills.map((skillCat: any, i: number) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={skillCat.category || ''}
                  onChange={(e) => updateArrayItem('skills', i, 'category', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginTop: '8px' }}>
                <label>Skills (comma-separated)</label>
                <textarea
                  key={`skill-${i}-${skillCat.items?.join('|')}`}
                  defaultValue={skillCat.items?.join(', ') || ''}
                  onBlur={(e) => {
                    const items = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                    updateArrayItem('skills', i, 'items', items);
                  }}
                  rows={3}
                  placeholder="e.g., JavaScript, React, Python"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="editor-section">
        <div className="section-header">
          <span className="section-icon">🏆</span>
          <h4>Certifications</h4>
        </div>
        {data.certifications && data.certifications.length > 0 ? (
          data.certifications.map((cert: any, i: number) => (
            <div key={i} className="form-grid" style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label>Certification Name</label>
                <input
                  type="text"
                  value={cert.name || ''}
                  onChange={(e) => updateArrayItem('certifications', i, 'name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Details</label>
                <input
                  type="text"
                  value={cert.details || ''}
                  onChange={(e) => updateArrayItem('certifications', i, 'details', e.target.value)}
                  placeholder="Issuing org or date"
                />
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--muted)', marginBottom: '12px' }}>No certifications added yet.</p>
        )}
        <button
          onClick={() => {
            const timestamp = Date.now();
            const newCerts = [...(data.certifications || []), { id: `cert-${timestamp}`, name: '', details: '' }];
            onChange({ ...data, certifications: newCerts });
          }}
          className="add-bullet-btn"
        >
          + Add Certification
        </button>
      </div>

      <div className="editor-section">
        <div className="section-header">
          <span className="section-icon">🎯</span>
          <h4>Achievements & Awards</h4>
        </div>
        {data.achievements && data.achievements.length > 0 ? (
          data.achievements.map((achievement: any, i: number) => (
            <div key={i} className="form-grid" style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={achievement.title || ''}
                  onChange={(e) => updateArrayItem('achievements', i, 'title', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="text"
                  value={achievement.date || ''}
                  onChange={(e) => updateArrayItem('achievements', i, 'date', e.target.value)}
                  placeholder="Year or date"
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea
                  value={achievement.description || ''}
                  onChange={(e) => updateArrayItem('achievements', i, 'description', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--muted)', marginBottom: '12px' }}>No achievements added yet.</p>
        )}
        <button
          onClick={() => {
            const timestamp = Date.now();
            const newAchievements = [...(data.achievements || []), { id: `achievement-${timestamp}`, title: '', description: '', date: '' }];
            onChange({ ...data, achievements: newAchievements });
          }}
          className="add-bullet-btn"
        >
          + Add Achievement
        </button>
      </div>

      <div className="editor-section">
        <div className="section-header">
          <span className="section-icon">🎨</span>
          <h4>Hobbies & Interests</h4>
        </div>
        <div className="form-group">
          <label>Hobbies (comma-separated)</label>
          <textarea
            value={data.hobbies?.join(', ') || ''}
            onChange={(e) => {
              const hobbies = e.target.value.split(',').map(s => s.trim()).filter(s => s);
              onChange({ ...data, hobbies });
            }}
            rows={3}
            placeholder="e.g., Photography, Hiking, Reading"
          />
        </div>
      </div>
      <style jsx>{`
        .profile-editor {
          position: relative;
        }

        .editor-section {
          position: relative;
          padding: 0;
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .section-icon {
          font-size: 24px;
        }

        .editor-section h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
        }

        :global(.form-group) {
          margin-bottom: 16px;
        }

        :global(.form-group label) {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--muted);
        }

        :global(.form-group input),
        :global(.form-group textarea) {
          width: 100%;
          background: var(--card2);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 12px;
          color: var(--text);
          font-size: 14px;
          transition: all 0.2s ease;
        }

        :global(.form-group input:focus),
        :global(.form-group textarea:focus) {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        :global(.form-grid) {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        :global(.experience-item) {
          background: var(--card2);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 16px;
          margin-bottom: 16px;
          position: relative;
        }

        :global(.bullet-input) {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          align-items: flex-start;
        }

        :global(.bullet-input textarea) {
          flex: 1;
        }

        :global(.remove-bullet) {
          padding: 6px 10px;
          background: rgba(168, 100, 91, 0.1);
          border: 1px solid rgba(168, 100, 91, 0.3);
          color: #a8645b;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        :global(.remove-bullet:hover) {
          background: rgba(168, 100, 91, 0.2);
        }

        :global(.add-bullet-btn) {
          background: var(--card2);
          border: 1px solid var(--line);
          color: var(--accent);
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        :global(.add-bullet-btn:hover) {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        :global(.bullets-section) {
          margin-top: 16px;
        }

        :global(.bullets-section > label) {
          display: block;
          margin-bottom: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--muted);
        }

        :global(.delete-item-btn) {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 10px;
          background: rgba(168, 100, 91, 0.1);
          border: 1px solid rgba(168, 100, 91, 0.3);
          color: #a8645b;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
          z-index: 10;
        }

        :global(.delete-item-btn:hover) {
          background: rgba(168, 100, 91, 0.2);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
