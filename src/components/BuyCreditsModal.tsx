'use client';

import { useState } from 'react';
import { CREDIT_PACKAGES } from '@/lib/credits-packages';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuy = async (packageId: string) => {
    setLoadingPackage(packageId);
    setError(null);

    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to start checkout');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoadingPackage(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          padding: '28px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text)' }}>Buy Credits</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
          Each credit lets you generate one AI-tailored resume. Choose a package below.
        </p>

        {error && (
          <div style={{ color: 'var(--error)', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: '12px' }}>
          {CREDIT_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handleBuy(pkg.id)}
              disabled={loadingPackage !== null}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: loadingPackage === pkg.id ? 'var(--card2)' : 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                cursor: loadingPackage !== null ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (loadingPackage === null) {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--line)';
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
                  {pkg.label}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                  {pkg.id === 'credits-12' ? 'Best value' : `${pkg.credits} resume generations`}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--accent)' }}>
                {pkg.displayPrice} CAD
              </div>
            </button>
          ))}
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
          Secure checkout powered by Stripe. CAD pricing.
        </p>
      </div>
    </div>
  );
}
