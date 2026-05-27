interface AddResumeCardProps {
  onClick: () => void;
  disabled?: boolean;
  onDisabledClick?: () => void;
}

export default function AddResumeCard({ onClick, disabled, onDisabledClick }: AddResumeCardProps) {
  const handleClick = () => {
    if (disabled && onDisabledClick) {
      onDisabledClick();
    } else if (!disabled) {
      onClick();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="resume-card add-card" 
        onClick={handleClick}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
        }}
      >
        {/* Base layer - always visible */}
        <div className="add-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <div className="card-info">
          <h3>Generate Resume</h3>
        </div>

        {/* Hover overlay - only when disabled */}
        {disabled && (
          <div
            className="disabled-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(51, 51, 51, 0.5)',
              borderRadius: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s ease',
              pointerEvents: 'none',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d4d4d4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 style={{ color: '#ffffff', margin: 0 }}>Generate Resume</h3>
          </div>
        )}
      </button>

      {/* CSS for hover effect */}
      <style jsx>{`
        .resume-card:hover .disabled-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
