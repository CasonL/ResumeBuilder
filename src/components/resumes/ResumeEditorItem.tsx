'use client';

import { Experience, Leadership, Project } from '@/types/resume-data';

interface Props {
  item: Experience | Leadership | Project;
  sectionType: 'experience' | 'leadership' | 'project';
  onChange: (updates: Partial<Experience | Leadership | Project>) => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function ResumeEditorItem({ item, sectionType, onChange, onMove, onDelete, canMoveUp, canMoveDown }: Props) {
  const isProject = sectionType === 'project';
  const title = isProject ? (item as Project).title : (item as Experience | Leadership).role;
  const subtitle = isProject ? '' : (item as Experience | Leadership).company;

  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...item.bullets];
    newBullets[index] = value;
    onChange({ bullets: newBullets });
  };

  const handleAddBullet = () => {
    onChange({ bullets: [...item.bullets, ''] });
  };

  const handleRemoveBullet = (index: number) => {
    onChange({ bullets: item.bullets.filter((_, i) => i !== index) });
  };

  return (
    <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => onMove('up')} disabled={!canMoveUp} style={arrowBtn}>↑</button>
          <button onClick={() => onMove('down')} disabled={!canMoveDown} style={arrowBtn}>↓</button>
        </div>
        <button onClick={onDelete} style={deleteBtn}>Remove</button>
      </div>

      {!isProject && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={(item as Experience | Leadership).role}
            onChange={(e) => onChange({ role: e.target.value })}
            style={inputStyle}
            placeholder="Role"
          />
          <input
            type="text"
            value={(item as Experience | Leadership).company}
            onChange={(e) => onChange({ company: e.target.value })}
            style={inputStyle}
            placeholder="Company / Organization"
          />
        </div>
      )}

      {isProject && (
        <input
          type="text"
          value={(item as Project).title}
          onChange={(e) => onChange({ title: e.target.value })}
          style={{ ...inputStyle, marginBottom: '10px' }}
          placeholder="Project title"
        />
      )}

      {!isProject && (
        <input
          type="text"
          value={(item as Experience | Leadership).dates}
          onChange={(e) => onChange({ dates: e.target.value })}
          style={{ ...inputStyle, marginBottom: '12px' }}
          placeholder="Dates"
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {item.bullets.map((bullet, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <textarea
              value={bullet}
              onChange={(e) => handleBulletChange(i, e.target.value)}
              rows={3}
              style={{ ...inputStyle, flex: 1, minHeight: '72px', resize: 'none' }}
              placeholder="Bullet point"
            />
            <button onClick={() => handleRemoveBullet(i)} style={smallDeleteBtn}>✕</button>
          </div>
        ))}
      </div>

      <button onClick={handleAddBullet} style={addBtn}>➕ Add bullet</button>
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

const arrowBtn: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '6px',
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: '12px'
};

const deleteBtn: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '6px',
  border: '1px solid #a8645b',
  background: 'transparent',
  color: '#a8645b',
  cursor: 'pointer',
  fontSize: '12px'
};

const smallDeleteBtn: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: '12px'
};

const addBtn: React.CSSProperties = {
  marginTop: '10px',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px dashed var(--line)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: '13px',
  width: '100%'
};
