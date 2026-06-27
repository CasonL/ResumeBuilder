'use client';

import { Certification } from '@/types/resume-data';

interface Props {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
}

export default function ResumeEditorCertifications({ certifications, onChange }: Props) {
  const handleChange = (index: number, field: 'name' | 'details', value: string) => {
    const newCerts = [...certifications];
    newCerts[index] = { ...newCerts[index], [field]: value };
    onChange(newCerts);
  };

  const handleAdd = () => {
    onChange([...certifications, { name: '', details: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(certifications.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === certifications.length - 1) return;
    const newCerts = [...certifications];
    const target = direction === 'up' ? index - 1 : index + 1;
    [newCerts[index], newCerts[target]] = [newCerts[target], newCerts[index]];
    onChange(newCerts);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {certifications.map((cert, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button onClick={() => handleMove(i, 'up')} disabled={i === 0} style={arrowBtn}>↑</button>
            <button onClick={() => handleMove(i, 'down')} disabled={i === certifications.length - 1} style={arrowBtn}>↓</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <input
              type="text"
              value={cert.name}
              onChange={(e) => handleChange(i, 'name', e.target.value)}
              style={inputStyle}
              placeholder="Certification"
            />
            <input
              type="text"
              value={cert.details || ''}
              onChange={(e) => handleChange(i, 'details', e.target.value)}
              style={inputStyle}
              placeholder="Details (optional)"
            />
          </div>
          <button onClick={() => handleRemove(i)} style={deleteBtn}>✕</button>
        </div>
      ))}

      <button onClick={handleAdd} style={addBtn}>➕ Add certification</button>
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
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: '12px'
};

const addBtn: React.CSSProperties = {
  marginTop: '4px',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px dashed var(--line)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: '13px',
  width: '100%'
};
