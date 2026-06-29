'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ResumeCard from './ResumeCard';
import AddResumeCard from './AddResumeCard';
import LogoutButton from './LogoutButton';

const GenerateResumeModal = dynamic(() => import('./GenerateResumeModal'), { ssr: false });
const BuyCreditsModal = dynamic(() => import('./BuyCreditsModal'), { ssr: false });

export default function Dashboard() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [credits, setCredits] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [masterData, setMasterData] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [savedFitCards, setSavedFitCards] = useState<any[]>([]);
  const [fitCardJD, setFitCardJD] = useState<string | undefined>(undefined);
  const router = useRouter();

  // Validate profile data for minimum requirements
  const getProfileValidation = () => {
    if (!masterData) {
      return {
        isValid: false,
        message: 'Add your profile information to get started'
      };
    }

    const experiences = masterData.experiences || [];
    const leadership = masterData.leadership || [];
    const totalExperiences = experiences.length + leadership.length;
    const hasSummary = masterData.personalInfo?.summary?.trim();

    if (totalExperiences < 2) {
      return {
        isValid: false,
        message: 'Add at least 2 experiences to generate a resume'
      };
    }

    if (!hasSummary) {
      return {
        isValid: false,
        message: 'Add a professional summary to your profile'
      };
    }

    return { isValid: true, message: '' };
  };

  const profileValidation = getProfileValidation();

  useEffect(() => {
    fetchResumes();
    fetchUserData();
    fetchMasterData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUserEmail(data.email || '');
        setCredits(data.credits ?? 0);
        setIsAdmin(data.isAdmin ?? false);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchMasterData = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setMasterData(data);
        setSavedFitCards(data.savedFitCards || []);
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  };

  const handleSaveFitCard = async (fitAssessment: any, jobDescription: string) => {
    const card = {
      id: `fit-${Date.now()}`,
      savedAt: new Date().toISOString(),
      jobDescription,
      preview: jobDescription.trim().split('\n')[0].slice(0, 80),
      fitAssessment,
    };
    const updated = [card, ...savedFitCards];
    setSavedFitCards(updated);
    await fetch('/api/profile/patch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedFitCards: updated }),
    });
  };

  const handleDeleteFitCard = async (id: string) => {
    const updated = savedFitCards.filter((c: any) => c.id !== id);
    setSavedFitCards(updated);
    await fetch('/api/profile/patch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedFitCards: updated }),
    });
  };

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes');
      const data = await response.json();
      if (data.resumes) {
        setResumes(data.resumes);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const handleGenerate = async (jobDescription: string, preferences: any) => {
    try {
      // Step 1: Generate initial resume
      const generateResponse = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, preferences }),
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate resume');
      }

      let data = await generateResponse.json();
      
      // Step 2 & 3: Always run critique + refine
      try {
        // Critique pass
        const critiqueResponse = await fetch('/api/critique-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobDescription,
            resumeContent: data.data,
            masterData: data.masterData,
          }),
        });

        if (critiqueResponse.ok) {
          const critiqueData = await critiqueResponse.json();
          
          // Refinement pass
          const refineResponse = await fetch('/api/refine-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobDescription,
              resumeContent: data.data,
              masterData: data.masterData,
              critique: critiqueData.critique,
            }),
          });

          if (refineResponse.ok) {
            const refinedData = await refineResponse.json();
            // Replace original data with refined version
            data.data = refinedData.data;
            // Add critique info for user to see
            data.critique = critiqueData.critique;
            data.refinementApplied = refinedData.data.refinementApplied;
          }
        }
      } catch (refinementError) {
        console.error('Refinement failed, using original:', refinementError);
        // Continue with original generation if refinement fails
      }
      
      sessionStorage.setItem('generatedResume', JSON.stringify(data));
      
      // Update credits display
      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining);
      }
      
      // Refresh resume list
      fetchResumes();
      
      setIsModalOpen(false);
      
      // Navigate to the generated resume
      if (data.resumeId) {
        router.push(`/resume/${data.resumeId}`);
      } else {
        router.push('/resume/preview');
      }
    } catch (error: any) {
      console.error('Error generating resume:', error);
      const errorMessage = error?.message || 'Failed to generate resume. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDelete = (deletedId: string) => {
    setResumes(resumes.filter(r => r.id !== deletedId));
  };

  return (
    <div className="dashboard">
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '16px 24px',
            background: 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            maxWidth: '500px',
            textAlign: 'center',
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          🔒 {notification} in{' '}
          <Link 
            href="/profile" 
            style={{ 
              color: 'white', 
              textDecoration: 'underline',
              fontWeight: 600
            }}
          >
            Profile
          </Link>
        </div>
      )}
      <div className="dashboard-nav">
        <div className="nav-user">
          <span className="user-email">{userEmail}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAdmin ? (
              <span style={{ 
                padding: '4px 8px', 
                background: 'rgba(139, 94, 60, 0.12)', 
                border: '1px solid rgba(139, 94, 60, 0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#8b5e3c'
              }}>
                ⚡ ADMIN
              </span>
            ) : (
              <button
                onClick={() => setIsBuyCreditsOpen(true)}
                style={{
                  padding: '4px 8px',
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line)';
                }}
              >
                💳 {credits} {credits === 1 ? 'credit' : 'credits'} <span style={{ color: 'var(--accent)' }}>+</span>
              </button>
            )}
            <Link href="/profile" className="nav-link">Profile</Link>
            <LogoutButton className="nav-link logout-btn" />
          </div>
        </div>
      </div>

      <header className="dashboard-header">
        <h1>My Resumes</h1>
      </header>

      <div className="resume-grid">
        {savedFitCards.map((card: any) => (
          <FitAssessmentCard
            key={card.id}
            card={card}
            onDelete={() => handleDeleteFitCard(card.id)}
            onEdit={() => { setFitCardJD(card.jobDescription); setIsModalOpen(true); }}
          />
        ))}
        {resumes.map((resume) => (
          <ResumeCard key={resume.id} resume={resume} onDelete={handleDelete} />
        ))}
        <AddResumeCard 
          onClick={() => { setFitCardJD(undefined); setIsModalOpen(true); }} 
          disabled={!profileValidation.isValid || (credits === 0 && !isAdmin)}
          onDisabledClick={() => {
            if (credits === 0 && !isAdmin) {
              setNotification('No credits remaining. Contact the admin to add credits.');
            } else {
              setNotification(profileValidation.message);
            }
            setTimeout(() => setNotification(null), 4000);
          }}
        />
      </div>

      <GenerateResumeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setFitCardJD(undefined); }}
        onGenerate={handleGenerate}
        onSaveFitCard={handleSaveFitCard}
        masterData={masterData}
        initialJobDescription={fitCardJD}
      />

      <BuyCreditsModal
        isOpen={isBuyCreditsOpen}
        onClose={() => setIsBuyCreditsOpen(false)}
      />
    </div>
  );
}

function FitAssessmentCard({ card, onDelete, onEdit }: { card: any; onDelete: () => void; onEdit: () => void }) {
  const score = Number(card.fitAssessment?.score ?? 0);
  const borderColor = score >= 7 ? '#16a34a' : score >= 5 ? '#b45309' : '#b91c1c';
  const scoreColor = score >= 7 ? '#15803d' : score >= 5 ? '#92400e' : '#991b1b';
  const bgColor = score >= 7 ? 'rgba(22,163,74,0.06)' : score >= 5 ? 'rgba(180,83,9,0.06)' : 'rgba(185,28,28,0.06)';
  const label = score >= 7 ? 'Strong Fit' : score >= 5 ? 'Transferable' : 'Long Shot';
  const date = new Date(card.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="resume-card" style={{ background: bgColor, border: `1.5px solid ${borderColor}`, position: 'relative', overflow: 'visible' }}>
      <button
        onClick={onEdit}
        title="Re-open with this job description"
        style={{
          position: 'absolute', top: '-10px', right: '-10px',
          width: '28px', height: '28px', borderRadius: '50%',
          background: '#f59e0b', border: '2px solid white',
          cursor: 'pointer', fontSize: '13px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.18)', zIndex: 2,
        }}
      >
        ✏️
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '22px', fontWeight: 800, color: scoreColor }}>{score}/10</span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.07em', background: `${borderColor}22`, padding: '2px 7px', borderRadius: '999px' }}>{label}</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--muted)' }}>{date}</span>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 6px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {card.preview}
      </p>
      {card.fitAssessment?.strongestThread && (
        <p style={{ fontSize: '12px', color: scoreColor, margin: '0 0 4px', lineHeight: 1.4 }}>
          ✓ {card.fitAssessment.strongestThread}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <button onClick={onDelete} style={{ fontSize: '11px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
          Remove
        </button>
      </div>
    </div>
  );
}
