import ResumeInnovates from './resumes/ResumeInnovates';
import ResumeTD from './resumes/ResumeTD';

interface ResumePreviewProps {
  variant: string;
}

export default function ResumePreview({ variant }: ResumePreviewProps) {
  return (
    <div className="resume-preview-container">
      <div className="resume-preview-scale">
        {variant === 'innovates' && <ResumeInnovates isActive={true} />}
        {variant === 'td' && <ResumeTD isActive={true} />}
      </div>
    </div>
  );
}
