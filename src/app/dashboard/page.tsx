'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  usageCount: number;
  usageLimit: number;
  lastLogin: string | null;
}

interface Notification {
  id: string;
  icon: string;
  text: string;
  time: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: '1', icon: '🎖️', text: 'Badge minted successfully on Base network', time: '2m ago', read: false },
  { id: '2', icon: '📊', text: 'Fortnite stats refreshed for your account', time: '1h ago', read: false },
  { id: '3', icon: '🔔', text: 'System maintenance scheduled for Sunday 2am UTC', time: '3h ago', read: true },
  { id: '4', icon: '✅', text: 'Account verification complete', time: '1d ago', read: true },
];

const DEMO_ACTIVITY = [
  { icon: '🔍', text: 'Fetched stats for player NightHawk_99', time: '5 minutes ago' },
  { icon: '🎖️', text: 'Initiated badge mint transaction', time: '2 hours ago' },
  { icon: '🔗', text: 'Wallet connected: 0x1a2b...3c4d', time: '1 day ago' },
  { icon: '🔑', text: 'Logged in from new browser', time: '2 days ago' },
  { icon: '📈', text: 'Reviewed season stats report', time: '3 days ago' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setError('not_authenticated');
      setLoading(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setUser(data);
        else setError('session_expired');
      })
      .catch(() => setError('network_error'))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const usagePct = user
    ? user.usageLimit === -1
      ? 0
      : Math.min(100, Math.round((user.usageCount / user.usageLimit) * 100))
    : 0;

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  if (error === 'not_authenticated' || error === 'session_expired') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h2 className="page-title">Authentication Required</h2>
        <p className="page-subtitle">Please sign in to view your dashboard.</p>
        <Link href="/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 className="page-title">
            Welcome back, {user?.name || 'User'} 👋
          </h1>
          <p className="page-subtitle">
            <span className={`nav-role-badge role-${user?.role}`}>{user?.role}</span>
            &nbsp;&nbsp;{user?.email}
          </p>
        </div>
        <Link href="/" className="btn btn-outline">
          🎮 Play Frame
        </Link>
      </div>

      {/* Stats Row */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">🔢</span>
          <span className="stat-label">API Calls Used</span>
          <span className="stat-value">{user?.usageCount ?? 0}</span>
          <span className="stat-change">↑ 12% this week</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <span className="stat-label">Usage Limit</span>
          <span className="stat-value">{user?.usageLimit === -1 ? '∞' : user?.usageLimit}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {user?.usageLimit === -1 ? 'Unlimited' : `${usagePct}% used`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🎖️</span>
          <span className="stat-label">Badges Minted</span>
          <span className="stat-value">3</span>
          <span className="stat-change">↑ 1 this month</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔔</span>
          <span className="stat-label">Notifications</span>
          <span className="stat-value">{unreadCount}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>unread</span>
        </div>
      </div>

      {/* Metered Usage Panel */}
      {user && user.usageLimit !== -1 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title">📈 Metered Usage</h2>
            <span className={`tag ${usagePct > 80 ? 'tag-red' : usagePct > 50 ? 'tag-orange' : 'tag-green'}`}>
              {usagePct}% used
            </span>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>{user.usageCount} calls used</span>
              <span>{user.usageLimit} limit</span>
            </div>
            <div className="meter-bar">
              <div
                className={`meter-fill${usagePct > 80 ? ' warn' : ''}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            {usagePct > 80 && (
              <div className="alert alert-error" style={{ marginTop: 12 }}>
                ⚠️ You are approaching your usage limit. Contact admin to increase your quota.
              </div>
            )}
          </div>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'This Hour', value: 4 },
              { label: 'Today', value: 15 },
              { label: 'This Month', value: user.usageCount },
            ].map((m) => (
              <div key={m.label} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{m.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">⚡ Recent Activity</h2>
          </div>
          <div className="activity-list">
            {DEMO_ACTIVITY.map((item, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon">{item.icon}</div>
                <div className="activity-body">
                  <div className="activity-text">{item.text}</div>
                  <div className="activity-time">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              🔔 Notifications
              {unreadCount > 0 && <span className="notif-dot" style={{ marginLeft: 8 }} />}
            </h2>
            {unreadCount > 0 && (
              <button className="btn btn-outline btn-sm" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '10px',
                  background: n.read ? 'var(--bg-secondary)' : 'rgba(99,102,241,0.08)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${n.read ? 'var(--border-subtle)' : 'var(--border-active)'}`,
                }}
              >
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{n.text}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</p>
                </div>
                {!n.read && <span className="tag tag-blue" style={{ alignSelf: 'flex-start' }}>New</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="section-title">⚙️ Account Settings</h2>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input className="form-input" defaultValue={user?.name} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" defaultValue={user?.email} type="email" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary">Save Changes</button>
          <button className="btn btn-outline">Change Password</button>
        </div>
      </div>
    </div>
  );
}
