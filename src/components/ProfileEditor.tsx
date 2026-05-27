'use client';

import { useState } from 'react';

export default function ProfileEditor({ data, onChange }: { data: any; onChange: (data: any) => void }) {
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [skillGenerationError, setSkillGenerationError] = useState<string | null>(null);
  const [isParsingCareerGoals, setIsParsingCareerGoals] = useState(false);
  const [careerGoalsError, setCareerGoalsError] = useState<string | null>(null);
  const [careerGoalsSuccess, setCareerGoalsSuccess] = useState<string | null>(null);
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

  const parseCareerGoals = async () => {
    if (!data.personalContext || data.personalContext.trim().length < 20) {
      setCareerGoalsError('Please write at least a few sentences about your career goals first.');
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

      // Merge experiences
      if (extractedData.experiences && extractedData.experiences.length > 0) {
        mergedData.experiences = [...(data.experiences || []), ...extractedData.experiences];
      }

      // Merge leadership
      if (extractedData.leadership && extractedData.leadership.length > 0) {
        mergedData.leadership = [...(data.leadership || []), ...extractedData.leadership];
      }

      // Merge projects
      if (extractedData.projects && extractedData.projects.length > 0) {
        mergedData.projects = [...(data.projects || []), ...extractedData.projects];
      }

      // Merge education
      if (extractedData.education && extractedData.education.length > 0) {
        mergedData.education = [...(data.education || []), ...extractedData.education];
      }

      // Merge skills (avoid duplicates)
      if (extractedData.skills && extractedData.skills.length > 0) {
        const existingSkills = new Set(
          (data.skills || [])
            .filter((s: any) => typeof s === 'string')
            .map((s: string) => s.toLowerCase())
        );
        const newSkills = extractedData.skills
          .filter((s: any) => typeof s === 'string')
          .filter((s: string) => !existingSkills.has(s.toLowerCase()));
        if (newSkills.length > 0) {
          mergedData.skills = [...(data.skills || []), ...newSkills];
        }
      }

      // Merge certifications (avoid duplicates)
      if (extractedData.certifications && extractedData.certifications.length > 0) {
        const existingCerts = new Set(
          (data.certifications || [])
            .filter((c: any) => typeof c === 'string')
            .map((c: string) => c.toLowerCase())
        );
        const newCerts = extractedData.certifications
          .filter((c: any) => typeof c === 'string')
          .filter((c: string) => !existingCerts.has(c.toLowerCase()));
        if (newCerts.length > 0) {
          mergedData.certifications = [...(data.certifications || []), ...newCerts];
        }
      }

      onChange(mergedData);
      setCareerGoalsSuccess('Successfully extracted and added information to your profile!');
      
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
    <div className="profile-editor-neon">
      <div className="editor-section-neon glow-cyan">
        <div className="section-header">
          <span className="section-icon">✨</span>
          <h4>Personal Context & Career Goals</h4>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '12px' }}>
          Tell us about your career goals, target roles, unique story, and what makes you stand out. 
          This helps the AI generate more personalized, context-aware recommendations.
        </p>
        <div className="form-group">
          <label>Your Story & Goals</label>
          <textarea
            value={data.personalContext || ''}
            onChange={(e) => onChange({ ...data, personalContext: e.target.value })}
            rows={6}
            placeholder="Example: I'm targeting Product Manager roles in fintech. I founded PitchIQ, an AI-powered sales training platform where I translated 60+ customer conversations into product decisions. I want to emphasize my product thinking, user insight skills, and ability to build in fast-paced environments. My strongest leverage is my hands-on experience building products from 0→1."
          />
        </div>
        <button
          onClick={parseCareerGoals}
          disabled={isParsingCareerGoals || !data.personalContext || data.personalContext.trim().length < 20}
          className="button-secondary"
          style={{ marginTop: '8px' }}
        >
          {isParsingCareerGoals ? '🤖 Extracting Info...' : '🤖 Extract Info from Text'}
        </button>
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

      <div className="editor-section-neon glow-blue">
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
            <label>Professional Summary</label>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>
              2-3 sentences that frame your ambition and position you for the role. Used to bridge the gap between your experience and target roles.
            </p>
            <textarea
              value={data.personalInfo?.summary || ''}
              onChange={(e) => updateField('personalInfo', 'summary', e.target.value)}
              rows={3}
              placeholder="Example: Builder-minded business student with experience creating AI-driven products, leading early-stage execution, and translating customer conversations into product decisions. Driven by systems thinking, rapid learning loops, and taking ideas from concept to traction."
            />
          </div>
        </div>
      </div>

      <div className="editor-section-neon glow-purple">
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

      <div className="editor-section-neon glow-pink">
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

      <div className="editor-section-neon glow-orange">
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

      <div className="editor-section-neon glow-green">
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
        <div className="editor-section-neon glow-yellow">
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
                background: 'rgba(234, 179, 8, 0.1)',
                borderColor: 'rgba(234, 179, 8, 0.3)',
                color: '#eab308'
              }}
            >
              {isGeneratingSkills ? '✨ Generating...' : '✨ AI Generate Skills'}
            </button>
          </div>
          {skillGenerationError && (
            <p style={{ 
              color: '#ef4444', 
              fontSize: '13px', 
              marginBottom: '12px',
              padding: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.3)'
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
                  value={skillCat.items?.join(', ') || ''}
                  onChange={(e) => {
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

      <div className="editor-section-neon glow-indigo">
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

      <div className="editor-section-neon glow-red">
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

      <div className="editor-section-neon glow-teal">
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
        .profile-editor-neon {
          position: relative;
        }

        .profile-editor-neon::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
          opacity: 0.4;
        }

        .editor-section-neon {
          position: relative;
          background: rgba(18, 20, 26, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          transition: all 0.3s ease;
          z-index: 2;
        }

        .editor-section-neon:hover {
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .section-icon {
          font-size: 24px;
          filter: drop-shadow(0 0 8px currentColor);
        }

        .editor-section-neon h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: linear-gradient(135deg, var(--text) 0%, var(--muted) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glow-cyan { box-shadow: 0 0 20px rgba(6, 182, 212, 0.15), inset 0 0 20px rgba(6, 182, 212, 0.03); }
        .glow-cyan:hover { box-shadow: 0 0 30px rgba(6, 182, 212, 0.25), inset 0 0 30px rgba(6, 182, 212, 0.05); }
        
        .glow-blue { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15), inset 0 0 20px rgba(59, 130, 246, 0.03); }
        .glow-blue:hover { box-shadow: 0 0 30px rgba(59, 130, 246, 0.25), inset 0 0 30px rgba(59, 130, 246, 0.05); }
        
        .glow-purple { box-shadow: 0 0 20px rgba(168, 85, 247, 0.15), inset 0 0 20px rgba(168, 85, 247, 0.03); }
        .glow-purple:hover { box-shadow: 0 0 30px rgba(168, 85, 247, 0.25), inset 0 0 30px rgba(168, 85, 247, 0.05); }
        
        .glow-pink { box-shadow: 0 0 20px rgba(236, 72, 153, 0.15), inset 0 0 20px rgba(236, 72, 153, 0.03); }
        .glow-pink:hover { box-shadow: 0 0 30px rgba(236, 72, 153, 0.25), inset 0 0 30px rgba(236, 72, 153, 0.05); }
        
        .glow-orange { box-shadow: 0 0 20px rgba(251, 146, 60, 0.15), inset 0 0 20px rgba(251, 146, 60, 0.03); }
        .glow-orange:hover { box-shadow: 0 0 30px rgba(251, 146, 60, 0.25), inset 0 0 30px rgba(251, 146, 60, 0.05); }
        
        .glow-green { box-shadow: 0 0 20px rgba(34, 197, 94, 0.15), inset 0 0 20px rgba(34, 197, 94, 0.03); }
        .glow-green:hover { box-shadow: 0 0 30px rgba(34, 197, 94, 0.25), inset 0 0 30px rgba(34, 197, 94, 0.05); }
        
        .glow-yellow { box-shadow: 0 0 20px rgba(234, 179, 8, 0.15), inset 0 0 20px rgba(234, 179, 8, 0.03); }
        .glow-yellow:hover { box-shadow: 0 0 30px rgba(234, 179, 8, 0.25), inset 0 0 30px rgba(234, 179, 8, 0.05); }
        
        .glow-indigo { box-shadow: 0 0 20px rgba(99, 102, 241, 0.15), inset 0 0 20px rgba(99, 102, 241, 0.03); }
        .glow-indigo:hover { box-shadow: 0 0 30px rgba(99, 102, 241, 0.25), inset 0 0 30px rgba(99, 102, 241, 0.05); }
        
        .glow-red { box-shadow: 0 0 20px rgba(239, 68, 68, 0.15), inset 0 0 20px rgba(239, 68, 68, 0.03); }
        .glow-red:hover { box-shadow: 0 0 30px rgba(239, 68, 68, 0.25), inset 0 0 30px rgba(239, 68, 68, 0.05); }
        
        .glow-teal { box-shadow: 0 0 20px rgba(20, 184, 166, 0.15), inset 0 0 20px rgba(20, 184, 166, 0.03); }
        .glow-teal:hover { box-shadow: 0 0 30px rgba(20, 184, 166, 0.25), inset 0 0 30px rgba(20, 184, 166, 0.05); }

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
          background: rgba(11, 12, 15, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 10px 12px;
          color: var(--text);
          font-size: 14px;
          transition: all 0.2s ease;
        }

        :global(.form-group input:focus),
        :global(.form-group textarea:focus) {
          outline: none;
          border-color: rgba(122, 162, 255, 0.5);
          box-shadow: 0 0 0 3px rgba(122, 162, 255, 0.1), 0 0 15px rgba(122, 162, 255, 0.2);
        }

        :global(.form-grid) {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        :global(.experience-item) {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
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
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        :global(.remove-bullet:hover) {
          background: rgba(239, 68, 68, 0.2);
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
        }

        :global(.add-bullet-btn) {
          background: rgba(122, 162, 255, 0.1);
          border: 1px solid rgba(122, 162, 255, 0.3);
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
          background: rgba(122, 162, 255, 0.2);
          box-shadow: 0 0 15px rgba(122, 162, 255, 0.3);
          transform: translateY(-1px);
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
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
          z-index: 10;
        }

        :global(.delete-item-btn:hover) {
          background: rgba(239, 68, 68, 0.2);
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
          transform: scale(1.05);
        }

        :global(.experience-item) {
          position: relative;
        }
      `}</style>
    </div>
  );
}
