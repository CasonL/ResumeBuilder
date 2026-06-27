'use client';

import { SkillCategory } from '@/types/resume-data';

interface Props {
  skills: SkillCategory[];
  onChange: (skills: SkillCategory[]) => void;
}

export default function ResumeEditorSkills({ skills, onChange }: Props) {
  const handleCategoryChange = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = { ...newSkills[index], category: value };
    onChange(newSkills);
  };

  const handleItemChange = (catIndex: number, itemIndex: number, value: string) => {
    const newSkills = [...skills];
    const items = [...newSkills[catIndex].items];
    items[itemIndex] = value;
    newSkills[catIndex] = { ...newSkills[catIndex], items };
    onChange(newSkills);
  };

  const handleAddItem = (catIndex: number) => {
    const newSkills = [...skills];
    newSkills[catIndex] = { ...newSkills[catIndex], items: [...newSkills[catIndex].items, ''] };
    onChange(newSkills);
  };

  const handleRemoveItem = (catIndex: number, itemIndex: number) => {
    const newSkills = [...skills];
    newSkills[catIndex] = {
      ...newSkills[catIndex],
      items: newSkills[catIndex].items.filter((_, i) => i !== itemIndex)
    };
    onChange(newSkills);
  };

  const handleAddCategory = () => {
    onChange([...skills, { category: 'New Category', items: [''] }]);
  };

  const handleRemoveCategory = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === skills.length - 1) return;
    const newSkills = [...skills];
    const target = direction === 'up' ? index - 1 : index + 1;
    [newSkills[index], newSkills[target]] = [newSkills[target], newSkills[index]];
    onChange(newSkills);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {skills.map((cat, catIndex) => (
        <div key={catIndex} style={{ paddingBottom: '20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
            <button onClick={() => handleMove(catIndex, 'up')} disabled={catIndex === 0} style={arrowBtn}>↑</button>
            <button onClick={() => handleMove(catIndex, 'down')} disabled={catIndex === skills.length - 1} style={arrowBtn}>↓</button>
            <input
              type="text"
              value={cat.category}
              onChange={(e) => handleCategoryChange(catIndex, e.target.value)}
              style={{ ...inputStyle, flex: 1, fontWeight: 600 }}
              placeholder="Category"
            />
            <button onClick={() => handleRemoveCategory(catIndex)} style={deleteBtn}>Remove</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cat.items.map((item, itemIndex) => (
              <div key={itemIndex} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleItemChange(catIndex, itemIndex, e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Skill"
                />
                <button onClick={() => handleRemoveItem(catIndex, itemIndex)} style={smallBtn}>✕</button>
              </div>
            ))}
          </div>

          <button onClick={() => handleAddItem(catIndex)} style={addBtn}>➕ Add skill</button>
        </div>
      ))}

      <button onClick={handleAddCategory} style={addBtn}>➕ Add category</button>
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

const smallBtn: React.CSSProperties = {
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
