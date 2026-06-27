'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hasUpdate?: boolean;
}

interface ProfileChatProps {
  profileData: any;
  onUpdate: (updatedProfile: any) => void;
}

export default function ProfileChat({ profileData, onUpdate }: ProfileChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/profile/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          profileData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response');

      if (data.profilePatch) {
        const merged = { ...profileData, ...data.profilePatch };
        onUpdate(merged);
        fetch('/api/profile/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged),
        }).catch(() => {});
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || 'No response', hasUpdate: !!data.profilePatch },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '24px', left: '24px', zIndex: 100,
          padding: '14px 20px', borderRadius: '9999px',
          background: 'var(--card-bg, #1e222d)', color: '#fff',
          border: '1px solid var(--border, #2a2f3a)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          cursor: 'pointer', fontSize: '14px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}
      >
        ✦ Profile Coach
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '24px', zIndex: 100,
      width: '380px', maxHeight: '600px', display: 'flex', flexDirection: 'column',
      borderRadius: '16px', background: '#171b24',
      border: '1px solid #2a2f3a', boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid #2a2f3a',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#1e222d',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>Profile Coach</span>
          <span style={{
            fontSize: '11px', padding: '2px 7px', borderRadius: '999px',
            background: 'rgba(255,255,255,0.08)', color: '#9ca3af', fontWeight: 600,
          }}>Free</span>
        </div>
        <button onClick={() => setIsOpen(false)} style={{
          background: 'transparent', border: 'none', color: '#9ca3af',
          cursor: 'pointer', fontSize: '18px', lineHeight: 1,
        }}>×</button>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px',
      }}>
        {messages.length === 0 && (
          <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.6 }}>
            I'll ask you questions to strengthen your profile — better profile means better resumes. Say hi to start, or ask me what's missing.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '90%', padding: '10px 12px', borderRadius: '12px',
            fontSize: '13px', lineHeight: 1.5,
            background: msg.role === 'user' ? '#2563eb' : '#2a2f3a',
            color: msg.role === 'user' ? '#fff' : '#e5e7eb',
          }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            {msg.hasUpdate && (
              <div style={{
                marginTop: '6px', fontSize: '11px', color: '#86efac',
                fontWeight: 600,
              }}>
                ✓ Profile updated
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{
            alignSelf: 'flex-start', padding: '10px 12px', borderRadius: '12px',
            fontSize: '13px', color: '#9ca3af', background: '#2a2f3a',
          }}>Thinking...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '12px', borderTop: '1px solid #2a2f3a',
        display: 'flex', gap: '8px', background: '#1e222d',
      }}>
        <input
          type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tell me about your experience..."
          style={{
            flex: 1, padding: '10px 12px', borderRadius: '10px',
            border: '1px solid #2a2f3a', background: '#171b24',
            color: '#fff', fontSize: '13px', outline: 'none',
          }}
        />
        <button
          onClick={handleSend} disabled={isLoading || !input.trim()}
          style={{
            padding: '10px 14px', borderRadius: '10px',
            background: input.trim() ? '#2563eb' : '#3b82f6',
            opacity: input.trim() ? 1 : 0.5,
            color: '#fff', border: 'none', fontSize: '13px',
            fontWeight: 600, cursor: input.trim() ? 'pointer' : 'not-allowed',
          }}
        >Send</button>
      </div>
    </div>
  );
}
