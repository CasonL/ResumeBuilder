'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const ProfileEditor = dynamic(() => import('@/components/ProfileEditor'), { ssr: false });
const ProfileChat = dynamic(() => import('@/components/ProfileChat'), { ssr: false });

interface ProfileData {
  personalInfo: {
    name?: string;
    pronouns?: string;
    location?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    summary?: string;
  };
  personalContext?: string;
  websiteContext?: string;
  websiteUrl?: string;
  education: {
    degree?: string;
    institution?: string;
    dates?: string;
    focus?: string;
  };
  experiences: any[];
  leadership: any[];
  projects: any[];
  skills: any[];
  certifications: any[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'upload' | 'website'>('personal');

  const refreshProfile = useCallback(() => {
    fetch('/api/profile')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
      })
      .then(data => {
        if (data) {
          setProfile(data);
        }
      })
      .catch(error => {
        console.error('Error fetching profile:', error);
      });
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <Link href="/" className="back-link">← Back to Dashboard</Link>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <Link href="/" className="back-link">← Back to Dashboard</Link>
        <h1>Profile & Resume Data</h1>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button
          className={`profile-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload Resume
        </button>
        <button
          className={`profile-tab ${activeTab === 'website' ? 'active' : ''}`}
          onClick={() => setActiveTab('website')}
        >
          Import Website
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'personal' && (
          <div className="profile-section">
            <h2>Personal Information</h2>
            <p className="section-subtitle">
              Edit your profile information below. This data will be used when generating tailored resumes.
            </p>
            <PersonalInfoEditor profile={profile} setProfile={setProfile} onSave={refreshProfile} />
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="profile-section">
            <h2>Upload Your Resume</h2>
            <p className="section-subtitle">
              Upload an existing resume and we'll automatically extract your experiences,
              skills, and other information using AI.
            </p>
            <ResumeUploader onUploadComplete={refreshProfile} />
          </div>
        )}

        {activeTab === 'website' && (
          <div className="profile-section">
            <h2>Import from Website</h2>
            <p className="section-subtitle">
              Enter the URL of your portfolio, personal site, or any page that describes your work.
              We'll scrape the text and write a summary used everywhere in the app.
            </p>
            <WebsiteImporter onImportComplete={refreshProfile} existingContext={profile?.websiteContext} existingUrl={profile?.websiteUrl} />
          </div>
        )}
      </div>
    </div>
  );
}

function PersonalInfoEditor({ profile, setProfile, onSave }: { profile: ProfileData | null; setProfile: (profile: ProfileData | null) => void; onSave: () => void }) {
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  // Auto-save with debouncing
  useEffect(() => {
    console.log('[Auto-save] Effect triggered');
    console.log('[Auto-save] editedProfile:', editedProfile);
    console.log('[Auto-save] profile:', profile);
    
    if (!editedProfile) {
      console.log('[Auto-save] No edited profile, skipping');
      return;
    }

    // Skip if profiles are identical
    const edited = JSON.stringify(editedProfile);
    const original = JSON.stringify(profile);
    if (edited === original) {
      console.log('[Auto-save] Profiles are identical, skipping');
      return;
    }

    console.log('[Auto-save] Changes detected, setting unsaved status');
    setSaveStatus('unsaved');
    
    const timeoutId = setTimeout(async () => {
      console.log('[Auto-save] Timeout triggered, saving...');
      setSaveStatus('saving');
      setError('');
      
      try {
        const response = await fetch('/api/profile/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedProfile),
        });

        if (!response.ok) {
          throw new Error('Auto-save failed');
        }

        console.log('[Auto-save] Save successful');
        setSaveStatus('saved');
        setSuccess('');
        // Update profile state to match editedProfile so comparison works correctly
        setProfile(editedProfile);
      } catch (err) {
        console.error('[Auto-save] Save failed:', err);
        setSaveStatus('unsaved');
        setError('Auto-save failed. Please save manually.');
      }
    }, 2000);

    return () => {
      console.log('[Auto-save] Cleanup - clearing timeout');
      clearTimeout(timeoutId);
    };
  }, [editedProfile, profile]);

  const handleSave = async () => {
    if (!editedProfile) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      setSuccess('Profile saved successfully!');
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!editedProfile) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--muted)' }}>No profile data yet. Upload a resume to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
          {saveStatus === 'saved' && '✓ All changes saved'}
          {saveStatus === 'saving' && '💾 Saving...'}
          {saveStatus === 'unsaved' && '⏳ Unsaved changes (auto-saving in 2s)'}
        </div>
      </div>

      <ProfileEditor data={editedProfile} onChange={setEditedProfile} />
      {editedProfile && (
        <ProfileChat
          profileData={editedProfile}
          onUpdate={(updated) => setEditedProfile(updated)}
        />
      )}

      {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <button
        onClick={handleSave}
        className="button-primary"
        disabled={isSaving}
        style={{ marginTop: '24px', width: '100%' }}
      >
        {isSaving ? 'Saving...' : 'Save Profile Now'}
      </button>
    </div>
  );
}

function ResumeUploader({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [resumeText, setResumeText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const validExtensions = ['.pdf', '.docx', '.txt'];
    
    const isValidType = validTypes.includes(file.type) || 
                       validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      setError('Please upload a PDF, DOCX, or TXT file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }
    
    setSelectedFile(file);
    setError('');
    setResumeText(''); // Clear text input when file is selected
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      // All file types (PDF, DOCX, TXT) handled server-side
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await fetch('/api/profile/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setParsedData(data.profile);
      setIsReviewing(true);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleParse = async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume text first');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Parsing failed');
      }

      setParsedData(data.profile);
      setIsReviewing(true);
      setResumeText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parsing failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveConfirmed = async () => {
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/profile/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      setSuccess('Profile saved successfully!');
      setIsReviewing(false);
      setParsedData(null);
      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsReviewing(false);
    setParsedData(null);
    setError('');
  };

  if (isReviewing && parsedData) {
    return (
      <div className="resume-uploader">
        <div className="review-header">
          <h3>Review & Edit Your Information</h3>
          <p className="review-subtitle">
            AI has extracted your resume data. Please review and correct any errors before saving.
          </p>
        </div>

        <ProfileEditor data={parsedData} onChange={setParsedData} />

        {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={handleCancel}
            className="button-secondary"
            style={{ flex: 1 }}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveConfirmed}
            className="button-primary"
            style={{ flex: 1 }}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Confirm & Save Profile'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-uploader">
      {/* File Upload Section */}
      <div 
        className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--line)'}`,
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          background: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'var(--card)',
          transition: 'all 0.2s ease',
          marginBottom: '24px'
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto', opacity: 0.5 }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        
        {selectedFile ? (
          <div>
            <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
              📄 {selectedFile.name}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px' }}>
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={() => setSelectedFile(null)}
              className="button-secondary"
              style={{ marginRight: '8px' }}
            >
              Remove
            </button>
            <button
              onClick={handleUploadFile}
              className="button-primary"
              disabled={isUploading}
            >
              {isUploading ? 'Parsing with AI (2 passes)...' : 'Upload & Parse'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
              Drop your resume here or click to browse
            </p>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px' }}>
              Supports PDF, DOCX, and TXT files (max 10MB)
            </p>
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.docx,.txt"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="resume-file-input" className="button-primary" style={{ cursor: 'pointer' }}>
              Choose File
            </label>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        margin: '24px 0',
        color: 'var(--muted)',
        fontSize: '14px'
      }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        <span>OR</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
      </div>

      {/* Text Paste Section */}
      <div className="paste-area">
        <label htmlFor="resume-text" className="paste-label">
          Paste Your Resume Text
        </label>
        <p className="paste-hint">
          Copy all text from your resume and paste it below. 
          The AI will extract and organize everything.
        </p>
        <textarea
          id="resume-text"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your entire resume here..."
          rows={10}
          className="resume-textarea"
        />
      </div>

      {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {resumeText.trim() && (
        <button
          onClick={handleParse}
          className="button-primary"
          disabled={isUploading}
          style={{ marginTop: '16px', width: '100%' }}
        >
          {isUploading ? 'Parsing with AI (2 passes)...' : 'Parse Resume'}
        </button>
      )}
    </div>
  );
}

function WebsiteImporter({ onImportComplete, existingContext, existingUrl }: { onImportComplete: () => void; existingContext?: string; existingUrl?: string }) {
  const [url, setUrl] = useState(existingUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(existingContext || '');
  const [scrapedUrl, setScrapedUrl] = useState(existingUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingContext);

  const handleScrape = async () => {
    if (!url.trim()) { setError('Please enter a URL'); return; }
    setIsLoading(true);
    setError('');
    setSummary('');
    try {
      const res = await fetch('/api/profile/scrape-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scrape failed');
      setSummary(data.summary);
      setScrapedUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const profileRes = await fetch('/api/profile');
      const currentProfile = await profileRes.json();
      const merged = { ...currentProfile, websiteContext: summary, websiteUrl: scrapedUrl };
      const saveRes = await fetch('/api/profile/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (!saveRes.ok) throw new Error('Failed to save');
      setSaved(true);
      onImportComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="resume-uploader">
      <div className="form-group">
        <label htmlFor="website-url">Portfolio or Website URL</label>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
          Enter your portfolio, personal site, or any page describing your work. The AI will read it and write a summary that gets used when building and scoring your resumes.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            id="website-url"
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setSummary(''); setSaved(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
            placeholder="https://yourportfolio.com"
            style={{ flex: 1 }}
          />
          <button onClick={handleScrape} className="button-primary" disabled={isLoading || !url.trim()}>
            {isLoading ? 'Reading...' : 'Import'}
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
          Note: works best with static sites. JavaScript-only apps (SPAs) may return little text.
        </p>
      </div>

      {error && <div className="error-message" style={{ marginTop: '12px' }}>{error}</div>}

      {summary && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ margin: 0 }}>AI Summary</label>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Edit if needed</span>
          </div>
          <div style={{ padding: '10px', background: 'var(--card-hover, rgba(99,102,241,0.05))', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px', color: 'var(--muted)', marginBottom: '10px', lineHeight: 1.6 }}>
            This summary will be used everywhere in the app — resume generation, fit scoring, and chat — as additional context about your background.
          </div>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={5}
            style={{ width: '100%', marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSave} className="button-primary" disabled={isSaving} style={{ flex: 1 }}>
              {isSaving ? 'Saving...' : saved ? '✓ Saved — Update' : 'Save to Profile'}
            </button>
          </div>
          {saved && <div className="success-message" style={{ marginTop: '8px' }}>Active across the app — re-import anytime to refresh.</div>}
        </div>
      )}
    </div>
  );
}
