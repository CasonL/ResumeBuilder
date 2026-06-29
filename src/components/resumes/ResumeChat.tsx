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
  onApplyChanges?: (data: any, masterData?: any, triggerFit?: boolean) => void;
  estimatedHeightPx?: number;
  targetLength?: string;
}

export default function ResumeChat({ resumeId, onApplyChanges, estimatedHeightPx, targetLength }: ResumeChatProps) {
  const BASE_LIMIT = 5;

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [pendingChange, setPendingChange] = useState<any>(null);
  const [pendingMasterChange, setPendingMasterChange] = useState<any>(null);
  const [pendingFitTrigger, setPendingFitTrigger] = useState(false);
  const [messageLimit, setMessageLimit] = useState(BASE_LIMIT);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const atLimit = userMessageCount >= messageLimit;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load persisted chat history on mount
  useEffect(() => {
    fetch(`/api/resumes/${resumeId}/chat-history`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length) setMessages(data.messages);
        if (data.messageLimit) setMessageLimit(data.messageLimit);
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false));
  }, [resumeId]);

  const persistHistory = (msgs: Message[], limit: number) => {
    fetch(`/api/resumes/${resumeId}/chat-history`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs, messageLimit: limit }),
    }).catch(() => {});
  };

  const isQuestion = (text: string) => {
    const t = text.trim();
    return t.endsWith('?') || /want me to|should i|shall i|would you like/i.test(t);
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const showQuickReplies = !isLoading && lastAssistantMsg && isQuestion(lastAssistantMsg.content) && !lastAssistantMsg.hasChanges;

  const handleQuickReply = (reply: string) => {
    setInput(reply);
    setTimeout(() => handleSendRaw(reply), 0);
  };

  const handleSendRaw = async (message: string) => {
    if (!message.trim() || isLoading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);
    setPendingChange(null);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          estimatedHeightPx,
          targetLength,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || 'Failed to get response');

      setMessages((prev) => {
        const next = [...prev, { role: 'assistant' as const, content: result.reply || 'No response', hasChanges: result.hasChanges }];
        persistHistory(next, messageLimit);
        return next;
      });

      if (result.modifiedResumeData) {
        setPendingChange(result.modifiedResumeData);
        setPendingMasterChange(result.modifiedMasterData || null);
        setPendingFitTrigger(result.triggerFit === true);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || atLimit) return;

    await handleSendRaw(input.trim());
  };

  const handleApply = () => {
    if (pendingChange && onApplyChanges) {
      onApplyChanges(pendingChange, pendingMasterChange || undefined, pendingFitTrigger);
      setPendingChange(null);
      setPendingMasterChange(null);
      setPendingFitTrigger(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>AI Resume Coach</span>
          <span style={{
            fontSize: '11px',
            padding: '2px 7px',
            borderRadius: '999px',
            background: atLimit ? 'rgba(168,100,91,0.2)' : 'rgba(255,255,255,0.08)',
            color: atLimit ? '#c97d4e' : '#9ca3af',
            fontWeight: 600,
          }}>
            {messageLimit - userMessageCount}/{messageLimit}
          </span>
        </div>
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
        {isLoadingHistory && (
          <div style={{ color: '#9ca3af', fontSize: '13px' }}>Loading chat history...</div>
        )}
        {!isLoadingHistory && messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
              Ask me anything about this resume. You have {messageLimit} messages — make them count.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                'Is this resume strong enough to get an interview?',
                'What do I need to learn to become more qualified for this role?',
                'Strengthen my weakest bullet points.',
                'Should I even apply to this role?',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setInput(q)}
                  style={{
                    textAlign: 'left',
                    padding: '7px 11px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#d1d5db',
                    fontSize: '12px',
                    cursor: 'pointer',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
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
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                {pendingMasterChange && (
                  <span style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 1.4 }}>
                    ✦ Also updates your master profile
                  </span>
                )}
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
        {atLimit && (
          <div style={{
            alignSelf: 'stretch',
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(139, 94, 60, 0.12)',
            border: '1px solid rgba(139, 94, 60, 0.3)',
            fontSize: '12px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#c97d4e', marginBottom: '8px' }}>
              You've used all {messageLimit} messages for this resume.
            </div>
            <button
              onClick={async () => {
                setIsUnlocking(true);
                setUnlockError(null);
                try {
                  const res = await fetch(`/api/resumes/${resumeId}/unlock-chat`, { method: 'POST' });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to unlock');
                  setMessageLimit((prev) => {
                    const next = prev + data.extraMessages;
                    persistHistory(messages, next);
                    return next;
                  });
                } catch (err: any) {
                  setUnlockError(err.message || 'Could not unlock. Check your credits.');
                } finally {
                  setIsUnlocking(false);
                }
              }}
              disabled={isUnlocking}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: '#8b5e3c',
                color: '#fff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isUnlocking ? 'wait' : 'pointer',
                opacity: isUnlocking ? 0.7 : 1,
              }}
            >
              {isUnlocking ? 'Unlocking...' : 'Unlock 10 more messages — 1 credit'}
            </button>
            {unlockError && (
              <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px' }}>{unlockError}</div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showQuickReplies && (
        <div style={{ padding: '6px 12px 0', display: 'flex', gap: '6px', background: '#1e222d' }}>
          {['Yes', 'No'].map((reply) => (
            <button
              key={reply}
              onClick={() => handleQuickReply(reply)}
              disabled={isLoading}
              style={{
                padding: '5px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: reply === 'Yes' ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.06)',
                color: reply === 'Yes' ? '#93c5fd' : '#9ca3af',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isLoading ? 'wait' : 'pointer',
              }}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

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
          disabled={atLimit}
          placeholder={atLimit ? 'Message limit reached' : 'Ask or tell me what to change...'}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid #2a2f3a',
            background: '#171b24',
            color: atLimit ? '#6b7280' : '#fff',
            fontSize: '13px',
            outline: 'none',
            cursor: atLimit ? 'not-allowed' : 'text',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim() || atLimit}
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
