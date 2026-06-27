'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hasChanges?: boolean;
}

interface ResumeChatProps {
  resumeId: string;
  onApplyChanges?: (data: any, masterData?: any) => void;
}

export default function ResumeChat({ resumeId, onApplyChanges }: ResumeChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingChange, setPendingChange] = useState<any>(null);
  const [pendingMasterChange, setPendingMasterChange] = useState<any>(null);
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
    setPendingChange(null);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to get response');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.reply || 'No response',
          hasChanges: result.hasChanges,
        },
      ]);

      if (result.modifiedResumeData) {
        setPendingChange(result.modifiedResumeData);
        setPendingMasterChange(result.modifiedMasterData || null);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (pendingChange && onApplyChanges) {
      onApplyChanges(pendingChange, pendingMasterChange || undefined);
      setPendingChange(null);
      setPendingMasterChange(null);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Changes applied to the resume. Click Save Changes to persist them.' },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        className="resume-chat-button"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          padding: '14px 20px',
          borderRadius: '9999px',
          background: '#171b24',
          color: '#fff',
          border: '1px solid #2a2f3a',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>✨</span> AI Resume Coach
      </button>
    );
  }

  return (
    <div
      className="resume-chat-panel"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 100,
        width: '380px',
        maxHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        background: '#171b24',
        border: '1px solid #2a2f3a',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #2a2f3a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1e222d',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>AI Resume Coach</span>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '420px',
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5 }}>
            Ask me anything about this resume or tell me what to change. I can read the job description, your profile, and the current resume.
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className="chat-message"
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%',
              padding: '10px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              lineHeight: 1.5,
              background: msg.role === 'user' ? '#2563eb' : '#2a2f3a',
              color: msg.role === 'user' ? '#fff' : '#e5e7eb',
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            {msg.hasChanges && onApplyChanges && (
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={handleApply}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#8b5e3c',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Apply Changes
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '10px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#9ca3af',
              background: '#2a2f3a',
            }}
          >
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: '12px',
          borderTop: '1px solid #2a2f3a',
          display: 'flex',
          gap: '8px',
          background: '#1e222d',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask or tell me what to change..."
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid #2a2f3a',
            background: '#171b24',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: input.trim() ? '#2563eb' : '#3b82f6',
            opacity: input.trim() ? 1 : 0.5,
            color: '#fff',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: input.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Send
        </button>
      </div>

    </div>
  );
}
