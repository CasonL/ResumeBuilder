'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ResumeCard from './ResumeCard';
import AddResumeCard from './AddResumeCard';
import GenerateResumeModal from './GenerateResumeModal';
import LogoutButton from './LogoutButton';
import { createClient } from '@/lib/supabase/client';

export default function Dashboard() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [credits, setCredits] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [masterData, setMasterData] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        
        // Fetch user credits and admin status
        const { data: userData } = await supabase
          .from('users')
          .select('credits, is_admin')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setCredits(userData.credits);
          setIsAdmin(userData.is_admin);
        }
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
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
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
                background: 'rgba(234, 179, 8, 0.2)', 
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#eab308'
              }}>
                ⚡ ADMIN
              </span>
            ) : (
              <span style={{ 
                padding: '4px 8px', 
                background: 'var(--card)', 
                border: '1px solid var(--line)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                💳 {credits} {credits === 1 ? 'credit' : 'credits'}
              </span>
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
        {resumes.map((resume) => (
          <ResumeCard key={resume.id} resume={resume} onDelete={handleDelete} />
        ))}
        <AddResumeCard 
          onClick={() => setIsModalOpen(true)} 
          disabled={!profileValidation.isValid}
          onDisabledClick={() => {
            setNotification(profileValidation.message);
            setTimeout(() => setNotification(null), 4000);
          }}
        />
      </div>

      <GenerateResumeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerate}
        masterData={masterData}
      />
    </div>
  );
}
