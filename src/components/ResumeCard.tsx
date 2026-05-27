'use client';

import Link from 'next/link';
import { Resume } from '@/types/resume';
import { useState } from 'react';

interface ResumeCardProps {
  resume: Resume;
  onDelete?: (id: string) => void;
}

export default function ResumeCard({ resume, onDelete }: ResumeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${resume.name}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/resumes/${resume.id}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      if (onDelete) {
        onDelete(resume.id);
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatResumeName = (name: string) => {
    const dashIndex = name.indexOf(' - ');
    if (dashIndex === -1) {
      return <>{name}</>;
    }
    const company = name.substring(0, dashIndex);
    const role = name.substring(dashIndex + 3); // +3 to skip " - "
    return (
      <>
        <strong>{company}</strong>
        <br />
        <span className="card-role">{role}</span>
      </>
    );
  };

  return (
    <Link href={`/resume/${resume.id}`} className="resume-card">
      <div className="card-info">
        <h3>{formatResumeName(resume.name)}</h3>
        <p className="card-meta">Updated {new Date(resume.updatedAt).toLocaleDateString()}</p>
      </div>
      {onDelete && !resume.isStatic && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="delete-resume-btn"
          title="Delete resume"
        >
          {isDeleting ? '...' : '🗑️'}
        </button>
      )}
    </Link>
  );
}
