type Props = {
  isActive: boolean;
  data: any;
  masterData: any;
  isEditing?: boolean;
  onUpdate?: (data: any) => void;
};

export default function ResumeGenerated({ isActive, data, masterData, isEditing = false, onUpdate }: Props) {
  if (!data || !masterData) return null;

  const handleBulletChange = (section: 'experiences' | 'leadership', itemId: string, bulletIndex: number, newValue: string) => {
    if (!onUpdate || !isEditing) return;
    
    const adjustments = { ...data.customizations.bulletPointAdjustments };
    if (!adjustments[itemId]) {
      const item = masterData[section].find((i: any) => i.id === itemId);
      adjustments[itemId] = [...item.bullets];
    }
    adjustments[itemId][bulletIndex] = newValue;
    
    onUpdate({
      ...data,
      customizations: {
        ...data.customizations,
        bulletPointAdjustments: adjustments
      }
    });
  };

  const handleDeleteBullet = (section: 'experiences' | 'leadership', itemId: string, bulletIndex: number) => {
    if (!onUpdate || !isEditing) return;
    
    const adjustments = { ...data.customizations.bulletPointAdjustments };
    if (!adjustments[itemId]) {
      const item = masterData[section].find((i: any) => i.id === itemId);
      adjustments[itemId] = [...item.bullets];
    }
    adjustments[itemId] = adjustments[itemId].filter((_: any, i: number) => i !== bulletIndex);
    
    onUpdate({
      ...data,
      customizations: {
        ...data.customizations,
        bulletPointAdjustments: adjustments
      }
    });
  };

  const handleAddBullet = (section: 'experiences' | 'leadership', itemId: string) => {
    if (!onUpdate || !isEditing) return;
    
    const adjustments = { ...data.customizations.bulletPointAdjustments };
    if (!adjustments[itemId]) {
      const item = masterData[section].find((i: any) => i.id === itemId);
      adjustments[itemId] = [...item.bullets];
    }
    adjustments[itemId].push('');
    
    onUpdate({
      ...data,
      customizations: {
        ...data.customizations,
        bulletPointAdjustments: adjustments
      }
    });
  };

  const handleDeleteItem = (section: 'selectedExperiences' | 'selectedLeadership' | 'selectedProjects', itemId: string) => {
    if (!onUpdate || !isEditing) return;
    
    onUpdate({
      ...data,
      [section]: data[section].filter((id: string) => id !== itemId)
    });
  };

  const handleDeleteSection = (section: 'selectedExperiences' | 'selectedLeadership' | 'selectedProjects' | 'selectedSkills') => {
    if (!onUpdate || !isEditing) return;
    
    onUpdate({
      ...data,
      [section]: []
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!onUpdate || !isEditing) return;
    
    onUpdate({
      ...data,
      customizations: {
        ...data.customizations,
        [field]: value
      }
    });
  };

  const handleRoleFieldChange = (itemId: string, field: 'role' | 'company', value: string) => {
    if (!onUpdate || !isEditing) return;
    
    const roleAdjustments = { ...data.customizations.roleAdjustments };
    if (!roleAdjustments[itemId]) {
      roleAdjustments[itemId] = {};
    }
    roleAdjustments[itemId][field] = value;
    
    onUpdate({
      ...data,
      customizations: {
        ...data.customizations,
        roleAdjustments
      }
    });
  };

  const handleSkillCategoryChange = (catIndex: number, field: 'category' | 'items', value: any) => {
    if (!onUpdate || !isEditing) return;
    const newSkills = [...data.selectedSkills];
    if (field === 'category') {
      newSkills[catIndex].category = value;
    } else {
      newSkills[catIndex].items = value;
    }
    onUpdate({ ...data, selectedSkills: newSkills });
  };

  const handleSkillItemChange = (catIndex: number, itemIndex: number, value: string) => {
    if (!onUpdate || !isEditing) return;
    const newSkills = [...data.selectedSkills];
    newSkills[catIndex].items[itemIndex] = value;
    onUpdate({ ...data, selectedSkills: newSkills });
  };

  const handleDeleteSkillItem = (catIndex: number, itemIndex: number) => {
    if (!onUpdate || !isEditing) return;
    const newSkills = [...data.selectedSkills];
    newSkills[catIndex].items = newSkills[catIndex].items.filter((_: any, i: number) => i !== itemIndex);
    onUpdate({ ...data, selectedSkills: newSkills });
  };

  const handleAddSkillItem = (catIndex: number) => {
    if (!onUpdate || !isEditing) return;
    const newSkills = [...data.selectedSkills];
    newSkills[catIndex].items.push('');
    onUpdate({ ...data, selectedSkills: newSkills });
  };

  const handleDeleteSkillCategory = (catIndex: number) => {
    if (!onUpdate || !isEditing) return;
    onUpdate({ ...data, selectedSkills: data.selectedSkills.filter((_: any, i: number) => i !== catIndex) });
  };

  const handleAddSkillCategory = () => {
    if (!onUpdate || !isEditing) return;
    const newSkills = [...data.selectedSkills, { category: '', items: [''] }];
    onUpdate({ ...data, selectedSkills: newSkills });
  };

  const handleProjectBulletChange = (projId: string, bulletIndex: number, newValue: string) => {
    if (!onUpdate || !isEditing) return;
    
    const adjustments = { ...data.customizations.bulletPointAdjustments };
    if (!adjustments[projId]) {
      const project = masterData.projects.find((p: any) => p.id === projId);
      adjustments[projId] = [...project.bullets];
    }
    adjustments[projId][bulletIndex] = newValue;
    
    onUpdate({
      ...data,
      customizations: {
        ...data.customizations,
        bulletPointAdjustments: adjustments
      }
    });
  };

  const handleDeleteProjectBullet = (projId: string, bulletIndex: number) => {
    if (!onUpdate || !isEditing) return;
    
    const adjustments = { ...data.customizations.bulletPointAdjustments };
    if (!adjustments[projId]) {
      const project = masterData.projects.find((p: any) => p.id === projId);
      adjustments[projId] = [...project.bullets];
    }
    adjustments[projId] = adjustments[projId].filter((_: any, i: number) => i !== bulletIndex);
    
    onUpdate({
      ...data,
      customizations: {
        ...data.customizations,
        bulletPointAdjustments: adjustments
      }
    });
  };

  const handleCertificationChange = (index: number, field: 'name' | 'details', value: string) => {
    if (!onUpdate || !isEditing) return;
    
    const certifications = data.customizations.certifications || [...masterData.certifications];
    certifications[index] = { ...certifications[index], [field]: value };
    
    onUpdate({
      ...data,
      customizations: {
        ...data.customizations,
        certifications
      }
    });
  };

  const handleDeleteCertification = (index: number) => {
    if (!onUpdate || !isEditing) return;
    
    const certifications = data.customizations.certifications || [...masterData.certifications];
    const newCerts = certifications.filter((_: any, i: number) => i !== index);
    
    onUpdate({
      ...data,
      customizations: {
        ...data.customizations,
        certifications: newCerts
      }
    });
  };

  return (
    <section className={`resume${isActive ? ' show print' : ''}`}>
      <header className="resume-header">
        <h1 className="resume-name">{masterData.personalInfo.name}</h1>
        {isEditing ? (
          <input
            type="text"
            value={data.customizations.headerTitle || ''}
            onChange={(e) => handleFieldChange('headerTitle', e.target.value)}
            className="resume-title-edit"
            placeholder="e.g., Product Strategy | AI Products | Fintech"
          />
        ) : (
          data.customizations.headerTitle && <p className="resume-title">{data.customizations.headerTitle}</p>
        )}
        <div className="resume-contact">
          {isEditing ? (
            <>
              <input
                type="email"
                value={data.customizations.email ?? masterData.personalInfo.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="contact-input"
                placeholder="email@example.com"
              />
              <span className="contact-sep">•</span>
              <input
                type="tel"
                value={data.customizations.phone ?? masterData.personalInfo.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className="contact-input"
                placeholder="123-456-7890"
              />
              <span className="contact-sep">•</span>
              <input
                type="text"
                value={data.customizations.location ?? masterData.personalInfo.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="contact-input"
                placeholder="City, State"
              />
            </>
          ) : (
            <>
              <span>{data.customizations.email ?? masterData.personalInfo.email}</span>
              <span className="contact-sep">•</span>
              <span>{data.customizations.phone ?? masterData.personalInfo.phone}</span>
              <span className="contact-sep">•</span>
              <span>{data.customizations.location ?? masterData.personalInfo.location}</span>
            </>
          )}
        </div>
      </header>

      <div className="resume-body">
        <main className="resume-main">
          {((data.customizations.summary !== null && data.customizations.summary !== undefined) ? data.customizations.summary : masterData.personalInfo?.summary) && (
            <section className="summary-section">
              {isEditing && (
                <button
                  onClick={() => handleFieldChange('summary', null)}
                  className="delete-summary-btn"
                  title="Delete summary section"
                >
                  ✕ Remove Summary
                </button>
              )}
              {isEditing ? (
                <textarea
                  value={data.customizations.summary ?? masterData.personalInfo?.summary ?? ''}
                  onChange={(e) => handleFieldChange('summary', e.target.value)}
                  className="summary-textarea"
                  placeholder="Professional summary..."
                  rows={3}
                />
              ) : (
                <p className="summary-text">{data.customizations.summary ?? masterData.personalInfo.summary}</p>
              )}
            </section>
          )}

          <section>
            <h2>Education</h2>
            <p>
              <b>{masterData.education.degree}</b> • {masterData.education.institution}{' '}
              <span className="small">({masterData.education.dates})</span>
            </p>
            {isEditing ? (
              <div className="field-edit-wrapper">
                <label className="edit-label">Focus:</label>
                <input
                  type="text"
                  value={data.customizations.educationFocus || masterData.education.focus || ''}
                  onChange={(e) => handleFieldChange('educationFocus', e.target.value)}
                  className="field-input"
                  placeholder="e.g., Product Strategy & Data-Driven Decision Making"
                />
              </div>
            ) : (
              masterData.education.focus && <p><b>Focus:</b> {data.customizations.educationFocus || masterData.education.focus}</p>
            )}
          </section>

          <section>
            <div className="section-header-row">
              <h2>Experience</h2>
              {isEditing && data.selectedExperiences?.length > 0 && (
                <button
                  onClick={() => handleDeleteSection('selectedExperiences')}
                  className="delete-full-section-btn"
                  title="Delete entire Experience section"
                >
                  🗑️ Delete Section
                </button>
              )}
            </div>
            {data.selectedExperiences?.map((expId: string) => {
              const experience = masterData.experiences.find((e: any) => e.id === expId);
              if (!experience) return null;

              const customBullets = data.customizations.bulletPointAdjustments?.[expId];
              const bullets = customBullets || experience.bullets;

              return (
                <div key={expId} className="role avoid-break">
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteItem('selectedExperiences', expId)}
                      className="delete-item-btn"
                      title="Remove this experience"
                    >
                      ✕
                    </button>
                  )}
                  <div className="role-head">
                    <div>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={data.customizations.roleAdjustments?.[expId]?.role ?? experience.role}
                            onChange={(e) => handleRoleFieldChange(expId, 'role', e.target.value)}
                            className="field-input"
                            style={{ display: 'inline-block', width: 'auto', minWidth: '150px', marginRight: '8px' }}
                          />
                          <span>•</span>
                          <input
                            type="text"
                            value={data.customizations.roleAdjustments?.[expId]?.company ?? experience.company}
                            onChange={(e) => handleRoleFieldChange(expId, 'company', e.target.value)}
                            className="field-input"
                            style={{ display: 'inline-block', width: 'auto', minWidth: '120px', marginLeft: '8px' }}
                          />
                        </>
                      ) : (
                        <>
                          <b>{data.customizations.roleAdjustments?.[expId]?.role ?? experience.role}</b> • {data.customizations.roleAdjustments?.[expId]?.company ?? experience.company}
                        </>
                      )}
                    </div>
                    <div className="small">{experience.dates}</div>
                  </div>
                  <ul>
                    {bullets.map((bullet: string, i: number) => (
                      <li key={i} className={isEditing ? 'editable-bullet' : ''}>
                        {isEditing ? (
                          <div className="bullet-edit-wrapper">
                            <textarea
                              value={bullet}
                              onChange={(e) => handleBulletChange('experiences', expId, i, e.target.value)}
                              rows={2}
                              className="bullet-textarea"
                            />
                            <button
                              onClick={() => handleDeleteBullet('experiences', expId, i)}
                              className="delete-bullet-btn"
                              title="Delete bullet"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          bullet
                        )}
                      </li>
                    ))}
                  </ul>
                  {isEditing && (
                    <button
                      onClick={() => handleAddBullet('experiences', expId)}
                      className="add-bullet-btn"
                      title="Add new bullet point"
                    >
                      ➕ Add Bullet
                    </button>
                  )}
                </div>
              );
            })}
          </section>

          {data.selectedLeadership && data.selectedLeadership.length > 0 && (
            <section>
              <div className="section-header-row">
                <h2>Leadership</h2>
                {isEditing && (
                  <button
                    onClick={() => handleDeleteSection('selectedLeadership')}
                    className="delete-full-section-btn"
                    title="Delete entire Leadership section"
                  >
                    🗑️ Delete Section
                  </button>
                )}
              </div>
              {data.selectedLeadership.map((leadId: string) => {
                const leadership = masterData.leadership.find((l: any) => l.id === leadId);
                if (!leadership) return null;

                const customBullets = data.customizations.bulletPointAdjustments?.[leadId];
                const bullets = customBullets || leadership.bullets;

                return (
                  <div key={leadId} className="role avoid-break">
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteItem('selectedLeadership', leadId)}
                        className="delete-item-btn"
                        title="Remove this leadership role"
                      >
                        ✕
                      </button>
                    )}
                    <div className="role-head">
                      <div>
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={data.customizations.roleAdjustments?.[leadId]?.role ?? leadership.role}
                              onChange={(e) => handleRoleFieldChange(leadId, 'role', e.target.value)}
                              className="field-input"
                              style={{ display: 'inline-block', width: 'auto', minWidth: '150px', marginRight: '8px' }}
                            />
                            <span>•</span>
                            <input
                              type="text"
                              value={data.customizations.roleAdjustments?.[leadId]?.company ?? leadership.company}
                              onChange={(e) => handleRoleFieldChange(leadId, 'company', e.target.value)}
                              className="field-input"
                              style={{ display: 'inline-block', width: 'auto', minWidth: '120px', marginLeft: '8px' }}
                            />
                          </>
                        ) : (
                          <>
                            <b>{data.customizations.roleAdjustments?.[leadId]?.role ?? leadership.role}</b> • {data.customizations.roleAdjustments?.[leadId]?.company ?? leadership.company}
                          </>
                        )}
                      </div>
                      <div className="small">{leadership.dates}</div>
                    </div>
                    <ul>
                      {bullets.map((bullet: string, i: number) => (
                        <li key={i} className={isEditing ? 'editable-bullet' : ''}>
                          {isEditing ? (
                            <div className="bullet-edit-wrapper">
                              <textarea
                                value={bullet}
                                onChange={(e) => handleBulletChange('leadership', leadId, i, e.target.value)}
                                rows={2}
                                className="bullet-textarea"
                              />
                              <button
                                onClick={() => handleDeleteBullet('leadership', leadId, i)}
                                className="delete-bullet-btn"
                                title="Delete bullet"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            bullet
                          )}
                        </li>
                      ))}
                    </ul>
                    {isEditing && (
                      <button
                        onClick={() => handleAddBullet('leadership', leadId)}
                        className="add-bullet-btn"
                        title="Add new bullet point"
                      >
                        ➕ Add Bullet
                      </button>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {data.selectedProjects && data.selectedProjects.length > 0 && (
            <section>
              <div className="section-header-row">
                <h2>Projects</h2>
                {isEditing && (
                  <button
                    onClick={() => handleDeleteSection('selectedProjects')}
                    className="delete-full-section-btn"
                    title="Delete entire Projects section"
                  >
                    🗑️ Delete Section
                  </button>
                )}
              </div>
              {data.selectedProjects.map((projId: string) => {
                const project = masterData.projects.find((p: any) => p.id === projId);
                if (!project) return null;

                const customBullets = data.customizations.bulletPointAdjustments?.[projId];
                const bullets = customBullets || project.bullets;

                return (
                  <div key={projId} className="avoid-break">
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteItem('selectedProjects', projId)}
                        className="delete-item-btn"
                        title="Remove this project"
                      >
                        ✕
                      </button>
                    )}
                    <p><b>{project.title}</b></p>
                    <ul>
                      {bullets.map((bullet: string, i: number) => (
                        <li key={i} className={isEditing ? 'editable-bullet' : ''}>
                          {isEditing ? (
                            <div className="bullet-edit-wrapper">
                              <textarea
                                value={bullet}
                                onChange={(e) => handleProjectBulletChange(projId, i, e.target.value)}
                                rows={2}
                                className="bullet-textarea"
                              />
                              <button
                                onClick={() => handleDeleteProjectBullet(projId, i)}
                                className="delete-bullet-btn"
                                title="Delete bullet"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            bullet
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
          )}

          {data.selectedSkills && data.selectedSkills.length > 0 && (() => {
            // Backward compatibility: convert old flat array to categorized format
            const normalizedSkills = typeof data.selectedSkills[0] === 'string' 
              ? [{ category: 'Skills', items: data.selectedSkills }]
              : data.selectedSkills;
            
            return (
              <section>
                <div className="section-header-row">
                  <h2>Skills</h2>
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteSection('selectedSkills')}
                      className="delete-full-section-btn"
                      title="Delete entire Skills section"
                    >
                      🗑️ Delete Section
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <>
                    {normalizedSkills.map((skillCat: any, catIndex: number) => (
                    <div key={catIndex} style={{ marginBottom: '16px', padding: '12px', background: 'var(--card)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={skillCat.category}
                          onChange={(e) => handleSkillCategoryChange(catIndex, 'category', e.target.value)}
                          className="field-input"
                          placeholder="Category name (e.g., Product + Strategy)"
                          style={{ flex: 1, fontWeight: 600 }}
                        />
                        <button
                          onClick={() => handleDeleteSkillCategory(catIndex)}
                          className="delete-skill-btn-inline"
                          title="Delete category"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="skills-list-edit">
                        {skillCat.items.map((item: string, itemIndex: number) => (
                          <div key={itemIndex} className="skill-edit-item">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => handleSkillItemChange(catIndex, itemIndex, e.target.value)}
                              className="skill-input-inline"
                              placeholder="Skill name"
                            />
                            <button
                              onClick={() => handleDeleteSkillItem(catIndex, itemIndex)}
                              className="delete-skill-btn-inline"
                              title="Remove skill"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleAddSkillItem(catIndex)}
                        className="add-bullet-btn"
                        style={{ fontSize: '11px', padding: '4px 8px', marginTop: '8px' }}
                      >
                        ➕ Add Skill to Category
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddSkillCategory}
                    className="add-bullet-btn"
                    title="Add new skill category"
                  >
                    ➕ Add Category
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {normalizedSkills.map((skillCat: any, i: number) => (
                    <p key={i} className="skills-comma-list" style={{ margin: 0 }}>
                      <strong>{skillCat.category}:</strong> {skillCat.items.join(', ')}
                    </p>
                  ))}
                </div>
              )}
              </section>
            );
          })()}

          {masterData.certifications && masterData.certifications.length > 0 && (
            <section>
              <h2>Certifications</h2>
              {isEditing ? (
                <div className="certs-list-edit">
                  {(data.customizations.certifications || masterData.certifications).map((cert: any, i: number) => (
                    <div key={i} className="cert-edit-item">
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => handleCertificationChange(i, 'name', e.target.value)}
                        className="cert-input-inline"
                        placeholder="Certification name"
                      />
                      <input
                        type="text"
                        value={cert.details || ''}
                        onChange={(e) => handleCertificationChange(i, 'details', e.target.value)}
                        className="cert-input-inline"
                        placeholder="Details"
                      />
                      <button
                        onClick={() => handleDeleteCertification(i)}
                        className="delete-skill-btn-inline"
                        title="Remove certification"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="certs-line">
                  {(data.customizations.certifications || masterData.certifications)
                    .map((cert: any) => cert.details ? `${cert.name}, ${cert.details}` : cert.name)
                    .join(' | ')}
                </p>
              )}
            </section>
          )}
        </main>
      </div>
    </section>
  );
}
