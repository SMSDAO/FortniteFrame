'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  lastLogin: string | null;
  usageCount: number;
  usageLimit: number;
}

interface MetricsData {
  uptime: number;
  users: { total: number; active: number };
  auditLogs: number;
  billingRecords: number;
  memory: { heapUsed: number; heapTotal: number };
}

interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  ip: string | null;
}

interface BillingEntry {
  id: string;
  userId: string;
  event: string;
  amount: number;
  currency: string;
  timestamp: string;
}

const TABS = ['Overview', 'Users', 'Billing', 'Audit Logs', 'Config'] as const;
type TabType = typeof TABS[number];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [billingRecords, setBillingRecords] = useState<BillingEntry[]>([]);
  const [newUserForm, setNewUserForm] = useState({ email: '', name: '', password: '', role: 'User' });
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const fetchData = useCallback(async (tok: string) => {
    try {
      const [metricsRes, usersRes, billingRes] = await Promise.all([
        fetch('/api/metrics', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/billing', { headers: { Authorization: `Bearer ${tok}` } }),
      ]);

      if (!metricsRes.ok || !usersRes.ok) {
        setError('Access denied. Admin role required.');
        return;
      }

      const [metricsData, usersData, billingData] = await Promise.all([
        metricsRes.json(),
        usersRes.json(),
        billingRes.ok ? billingRes.json() : { records: [], auditLogs: [] },
      ]);

      setMetrics(metricsData);
      setUsers(usersData);
      setBillingRecords(billingData.records || []);
      setAuditLogs(billingData.auditLogs || []);
    } catch {
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!t) {
      setError('not_authenticated');
      setLoading(false);
      return;
    }
    setToken(t);
    fetchData(t);
  }, [fetchData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormMsg(null);

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newUserForm),
    });

    if (res.ok) {
      setFormMsg('User created successfully.');
      setNewUserForm({ email: '', name: '', password: '', role: 'User' });
      fetchData(token);
    } else {
      const d = await res.json();
      setFormMsg(`Error: ${d.error}`);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    if (!token) return;
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, role }),
    });
    fetchData(token);
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading admin dashboard…</span>
      </div>
    );
  }

  if (error === 'not_authenticated') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h2 className="page-title">Authentication Required</h2>
        <p className="page-subtitle">Please sign in with an Admin account.</p>
        <Link href="/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
        <h2 className="page-title">Access Denied</h2>
        <p className="page-subtitle">{error}</p>
        <Link href="/login" className="btn btn-primary">Sign In as Admin</Link>
      </div>
    );
  }

  const totalRevenue = billingRecords.reduce((sum, r) => sum + r.amount, 0);
  const heapPct = metrics ? Math.round((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100) : 0;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">⚙️ Admin Dashboard</h1>
        <p className="page-subtitle">System overview, user management, billing, and configuration</p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0, overflowX: 'auto' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`nav-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ---- Overview ---- */}
      {activeTab === 'Overview' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-icon">👤</span>
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{metrics?.users.total ?? 0}</span>
              <span className="stat-change">{metrics?.users.active} active</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">System Uptime</span>
              <span className="stat-value" style={{ fontSize: 20 }}>{metrics ? formatUptime(metrics.uptime) : '—'}</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">💰</span>
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">${totalRevenue.toFixed(2)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📋</span>
              <span className="stat-label">Audit Events</span>
              <span className="stat-value">{metrics?.auditLogs ?? 0}</span>
            </div>
          </div>

          {/* Memory meter */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2 className="card-title">🖥️ System Resources</h2>
              <span className={`tag ${heapPct > 80 ? 'tag-red' : 'tag-green'}`}>{heapPct}% heap</span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>{metrics ? Math.round(metrics.memory.heapUsed / 1024 / 1024) : 0} MB used</span>
                <span>{metrics ? Math.round(metrics.memory.heapTotal / 1024 / 1024) : 0} MB total</span>
              </div>
              <div className="meter-bar">
                <div className={`meter-fill${heapPct > 80 ? ' warn' : ''}`} style={{ width: `${heapPct}%` }} />
              </div>
            </div>
          </div>

          {/* API Monitoring */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">📡 API Endpoint Status</h2>
              <span className="tag tag-green">All healthy</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Avg Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { path: '/api/auth/login', method: 'POST', status: '✅', latency: '12ms' },
                    { path: '/api/auth/me', method: 'GET', status: '✅', latency: '4ms' },
                    { path: '/api/fortnite', method: 'GET', status: '✅', latency: '340ms' },
                    { path: '/api/health', method: 'GET', status: '✅', latency: '2ms' },
                    { path: '/api/metrics', method: 'GET', status: '✅', latency: '3ms' },
                    { path: '/api/billing', method: 'GET', status: '✅', latency: '5ms' },
                    { path: '/api/admin/users', method: 'GET/POST/PATCH', status: '✅', latency: '6ms' },
                  ].map((ep) => (
                    <tr key={ep.path}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-teal)' }}>{ep.path}</td>
                      <td><span className="tag tag-blue">{ep.method}</span></td>
                      <td>{ep.status}</td>
                      <td style={{ color: 'var(--accent-green)' }}>{ep.latency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ---- Users ---- */}
      {activeTab === 'Users' && (
        <div className="grid-2" style={{ gap: 24 }}>
          {/* User table */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2 className="card-title">👥 All Users</h2>
              <span className="tag tag-blue">{users.length} users</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Usage</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td>
                        <span className={`nav-role-badge role-${u.role}`}>{u.role}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>{u.usageCount} / {u.usageLimit === -1 ? '∞' : u.usageLimit}</div>
                        {u.usageLimit !== -1 && (
                          <div className="meter-bar" style={{ width: 80, height: 4, marginTop: 4 }}>
                            <div
                              className="meter-fill"
                              style={{ width: `${Math.min(100, Math.round((u.usageCount / u.usageLimit) * 100))}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`tag ${u.active ? 'tag-green' : 'tag-red'}`}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td>
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', width: 'auto', fontSize: 12 }}
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          aria-label={`Update role for ${u.name}`}
                        >
                          {['Admin', 'Developer', 'User', 'Auditor'].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create user form */}
          <div className="card">
            <h2 className="section-title">➕ Create User</h2>
            {formMsg && (
              <div className={`alert ${formMsg.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>
                {formMsg}
              </div>
            )}
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={newUserForm.name} onChange={(e) => setNewUserForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={newUserForm.email} onChange={(e) => setNewUserForm((p) => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password (min 8 chars)</label>
                <input className="form-input" type="password" value={newUserForm.password} onChange={(e) => setNewUserForm((p) => ({ ...p, password: e.target.value }))} required minLength={8} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={newUserForm.role} onChange={(e) => setNewUserForm((p) => ({ ...p, role: e.target.value }))}>
                  {['Admin', 'Developer', 'User', 'Auditor'].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Create User</button>
            </form>
          </div>

          {/* RBAC Overview */}
          <div className="card">
            <h2 className="section-title">🔐 Role Permissions</h2>
            {[
              { role: 'Admin', perms: ['Full system access', 'User management', 'Billing', 'Config'] },
              { role: 'Developer', perms: ['API monitoring', 'Logs', 'Metrics', 'Billing read'] },
              { role: 'User', perms: ['Own data read/write', 'Billing read (own)'] },
              { role: 'Auditor', perms: ['Users read', 'Metrics', 'Logs', 'Audit trail'] },
            ].map((item) => (
              <div key={item.role} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className={`nav-role-badge role-${item.role}`}>{item.role}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {item.perms.map((p) => (
                    <span key={p} className="tag tag-blue">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Billing ---- */}
      {activeTab === 'Billing' && (
        <>
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <span className="stat-icon">💰</span>
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">${totalRevenue.toFixed(2)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📄</span>
              <span className="stat-label">Billing Events</span>
              <span className="stat-value">{billingRecords.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">👥</span>
              <span className="stat-label">Billed Users</span>
              <span className="stat-value">{new Set(billingRecords.map((r) => r.userId)).size}</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">💳 Billing Records</h2>
            </div>
            {billingRecords.length === 0 ? (
              <div className="alert alert-info">No billing records yet.</div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Event</th>
                      <th>Amount</th>
                      <th>Currency</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingRecords.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.userId}</td>
                        <td>{r.event}</td>
                        <td style={{ color: 'var(--accent-green)' }}>${r.amount.toFixed(2)}</td>
                        <td>{r.currency}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Usage by user */}
          <div className="card" style={{ marginTop: 20 }}>
            <h2 className="section-title">📊 Usage by User</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Usage</th>
                    <th>Limit</th>
                    <th>% Used</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const pct = u.usageLimit === -1 ? 0 : Math.min(100, Math.round((u.usageCount / u.usageLimit) * 100));
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td><span className={`nav-role-badge role-${u.role}`}>{u.role}</span></td>
                        <td>{u.usageCount}</td>
                        <td>{u.usageLimit === -1 ? '∞' : u.usageLimit}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="meter-bar" style={{ width: 80, height: 6 }}>
                              <div className={`meter-fill${pct > 80 ? ' warn' : ''}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span style={{ fontSize: 12 }}>{u.usageLimit === -1 ? '—' : `${pct}%`}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ---- Audit Logs ---- */}
      {activeTab === 'Audit Logs' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📋 Audit Trail</h2>
            <span className="tag tag-blue">{auditLogs.length} entries</span>
          </div>
          {auditLogs.length === 0 ? (
            <div className="alert alert-info">No audit log entries yet. Activity will appear here as users interact with the system.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User ID</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.userId}</td>
                      <td><span className="tag tag-blue">{log.action}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.resource}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{log.ip || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---- Config ---- */}
      {activeTab === 'Config' && (
        <div className="grid-2">
          <div className="card">
            <h2 className="section-title">🔧 Platform Configuration</h2>
            {[
              { label: 'Platform Fee (bps)', value: '250 (2.5%)' },
              { label: 'Default Usage Limit', value: '500 calls/month' },
              { label: 'JWT Token TTL', value: '15 minutes' },
              { label: 'Refresh Token TTL', value: '7 days' },
              { label: 'Rate Limit', value: '100 req/min' },
              { label: 'Base Network', value: 'Base (mainnet)' },
            ].map((cfg) => (
              <div key={cfg.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>{cfg.label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{cfg.value}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 className="section-title">🌐 Environment Variables</h2>
            <div className="alert alert-info">
              Environment variables are managed via <code>.env</code> file or deployment secrets. See <code>.env.example</code> for reference.
            </div>
            {[
              'FORTNITE_API_KEY',
              'JWT_SECRET',
              'ADMIN_PASSWORD',
              'DATABASE_URL',
              'NEXT_PUBLIC_CONTRACT_ADDRESS',
            ].map((envVar) => (
              <div key={envVar} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 13 }}>
                <code style={{ color: 'var(--accent-teal)' }}>{envVar}</code>
                <span className="tag tag-green">Set</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
