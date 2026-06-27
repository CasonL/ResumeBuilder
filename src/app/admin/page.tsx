'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!userData?.is_admin) {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      fetchUsers();
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/dashboard');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error toggling admin:', error);
      alert('Failed to update admin status');
    }
  };

  const addCredits = async (userId: string) => {
    const amount = prompt('How many credits to add?');
    if (!amount || isNaN(Number(amount))) return;

    try {
      const response = await fetch('/api/admin/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: Number(amount) }),
      });

      if (!response.ok) throw new Error('Failed to add credits');
      
      fetchUsers();
      alert(`Added ${amount} credits successfully`);
    } catch (error) {
      console.error('Error adding credits:', error);
      alert('Failed to add credits');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '32px' }}>Admin Panel</h1>
      
      <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--line)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Full Name</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Credits</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Admin</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Joined</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '12px' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>{user.full_name || '-'}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                  {user.credits}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {user.is_admin ? (
                    <span style={{ color: '#8b5e3c' }}>⚡ Yes</span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>No</span>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => addCredits(user.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        background: 'rgba(124, 140, 98, 0.1)',
                        border: '1px solid rgba(124, 140, 98, 0.3)',
                        color: '#7c8c62',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      + Credits
                    </button>
                    <button
                      onClick={() => toggleAdmin(user.id, user.is_admin)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        background: user.is_admin ? 'rgba(168, 100, 91, 0.1)' : 'rgba(139, 94, 60, 0.1)',
                        border: user.is_admin ? '1px solid rgba(168, 100, 91, 0.3)' : '1px solid rgba(139, 94, 60, 0.3)',
                        color: user.is_admin ? '#a8645b' : '#8b5e3c',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '32px' }}>
          No users found
        </p>
      )}
    </div>
  );
}
