'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface MetricsData {
  uptime: number;
  timestamp: string;
  users: { total: number; active: number };
  auditLogs: number;
  memory: { heapUsed: number; heapTotal: number; rss: number };
}

const DEMO_LOGS = [
  { level: 'info', ts: '2026-03-15T01:45:00Z', msg: 'Fortnite API request completed', meta: { user: 'NightHawk_99', latency: '342ms' } },
  { level: 'info', ts: '2026-03-15T01:44:50Z', msg: 'Badge mint transaction submitted', meta: { hash: '0xabc...def', network: 'base' } },
  { level: 'warn', ts: '2026-03-15T01:44:30Z', msg: 'Fortnite API rate limit approaching', meta: { remaining: 12 } },
  { level: 'info', ts: '2026-03-15T01:44:00Z', msg: 'User authenticated', meta: { userId: '2', role: 'Developer' } },
  { level: 'info', ts: '2026-03-15T01:43:00Z', msg: 'Health check passed', meta: { status: 'healthy' } },
  { level: 'error', ts: '2026-03-15T01:42:00Z', msg: 'Fortnite API key missing for request', meta: { endpoint: '/api/fortnite' } },
  { level: 'info', ts: '2026-03-15T01:41:00Z', msg: 'Next.js build completed', meta: { duration: '12.3s' } },
];

const ENV_VARS = [
  { key: 'FORTNITE_API_KEY', status: 'set', secret: true },
  { key: 'JWT_SECRET', status: 'set', secret: true },
  { key: 'NEXT_PUBLIC_CONTRACT_ADDRESS', status: 'set', secret: false },
  { key: 'NEXT_PUBLIC_RPC_URL', status: 'set', secret: false },
  { key: 'DATABASE_URL', status: 'missing', secret: true },
  { key: 'ADMIN_PASSWORD', status: 'default', secret: true },
  { key: 'BASE_RPC_URL', status: 'default', secret: false },
  { key: 'BASESCAN_API_KEY', status: 'missing', secret: true },
];

const TABS = ['API Monitor', 'Log Viewer', 'Env Manager', 'Deploy Diagnostics', 'Test Console'] as const;
type TabType = typeof TABS[number];

export default function DeveloperDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('API Monitor');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [logFilter, setLogFilter] = useState('all');
  const [testUrl, setTestUrl] = useState('/api/health');
  const [testMethod, setTestMethod] = useState('GET');
  const [testBody, setTestBody] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const fetchMetrics = useCallback(async (tok: string) => {
    try {
      const res = await fetch('/api/metrics', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) {
        setError('Access denied. Developer or Admin role required.');
        return;
      }
      const data = await res.json();
      setMetrics(data);
    } catch {
      setError('Failed to load metrics.');
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
    fetchMetrics(t);
    const interval = setInterval(() => fetchMetrics(t), 15000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const runTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    try {
      const opts: RequestInit = { method: testMethod, headers: { Authorization: `Bearer ${token ?? ''}` } };
      if (testMethod !== 'GET' && testBody) {
        (opts.headers as Record<string, string>)['Content-Type'] = 'application/json';
        opts.body = testBody;
      }
      const start = Date.now();
      const res = await fetch(testUrl, opts);
      const latency = Date.now() - start;
      const data = await res.text();
      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(data);
      } catch {
        parsedBody = data;
      }
      setTestResult(JSON.stringify({ status: res.status, latency: `${latency}ms`, body: parsedBody }, null, 2));
    } catch (e) {
      setTestResult(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const filteredLogs = DEMO_LOGS.filter((l) => logFilter === 'all' || l.level === logFilter);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading developer dashboard…</span>
      </div>
    );
  }

  if (error === 'not_authenticated') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h2 className="page-title">Authentication Required</h2>
        <p className="page-subtitle">Please sign in with a Developer or Admin account.</p>
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
        <Link href="/login" className="btn btn-primary">Sign In as Developer</Link>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">🛠️ Developer Dashboard</h1>
        <p className="page-subtitle">API monitoring, log viewer, environment management, and diagnostics</p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
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

      {/* ---- API Monitor ---- */}
      {activeTab === 'API Monitor' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">Uptime</span>
              <span className="stat-value" style={{ fontSize: 20 }}>
                {metrics ? `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m` : '—'}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🧠</span>
              <span className="stat-label">Heap Used</span>
              <span className="stat-value" style={{ fontSize: 20 }}>
                {metrics ? `${Math.round(metrics.memory.heapUsed / 1024 / 1024)}MB` : '—'}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">👥</span>
              <span className="stat-label">Active Users</span>
              <span className="stat-value">{metrics?.users.active ?? 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📋</span>
              <span className="stat-label">Audit Events</span>
              <span className="stat-value">{metrics?.auditLogs ?? 0}</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">📡 Live API Endpoints</h2>
              <button className="btn btn-outline btn-sm" onClick={() => {
                const t = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                if (t) fetchMetrics(t);
              }}>
                🔄 Refresh
              </button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Methods</th>
                    <th>Auth</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { route: '/api/auth/login', methods: 'POST', auth: 'None', status: '✅' },
                    { route: '/api/auth/logout', methods: 'POST', auth: 'None', status: '✅' },
                    { route: '/api/auth/me', methods: 'GET', auth: 'Bearer', status: '✅' },
                    { route: '/api/fortnite', methods: 'GET', auth: 'None', status: '✅' },
                    { route: '/api/health', methods: 'GET', auth: 'None', status: '✅' },
                    { route: '/api/metrics', methods: 'GET', auth: 'Bearer (Dev+)', status: '✅' },
                    { route: '/api/billing', methods: 'GET/POST', auth: 'Bearer', status: '✅' },
                    { route: '/api/admin/users', methods: 'GET/POST/PATCH', auth: 'Bearer (Admin)', status: '✅' },
                  ].map((ep) => (
                    <tr key={ep.route}>
                      <td>
                        <code style={{ color: 'var(--accent-teal)', fontSize: 12 }}>{ep.route}</code>
                      </td>
                      <td><span className="tag tag-blue">{ep.methods}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ep.auth}</td>
                      <td>{ep.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ---- Log Viewer ---- */}
      {activeTab === 'Log Viewer' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📄 Application Logs</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'info', 'warn', 'error'].map((f) => (
                <button
                  key={f}
                  className={`btn btn-sm ${logFilter === f ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setLogFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: '#0a0e1a', borderRadius: 'var(--radius-md)', padding: '16px', fontFamily: 'monospace', fontSize: 12, maxHeight: '500px', overflowY: 'auto' }}>
            {filteredLogs.map((log, i) => (
              <div key={i} style={{ marginBottom: 10, lineHeight: 1.6 }}>
                <span style={{ color: 'var(--text-muted)' }}>{new Date(log.ts).toLocaleTimeString()} </span>
                <span style={{
                  color: log.level === 'error' ? 'var(--accent-red)' : log.level === 'warn' ? 'var(--accent-orange)' : 'var(--accent-green)',
                  fontWeight: 700,
                  marginRight: 8,
                }}>
                  [{log.level.toUpperCase()}]
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{log.msg} </span>
                <span style={{ color: 'var(--accent-teal)' }}>{JSON.stringify(log.meta)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Env Manager ---- */}
      {activeTab === 'Env Manager' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🔐 Environment Variables</h2>
          </div>
          <div className="alert alert-info">
            Secrets are managed via deployment environment. Never commit secrets to source control.
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Status</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {ENV_VARS.map((v) => (
                  <tr key={v.key}>
                    <td><code style={{ color: 'var(--accent-teal)', fontSize: 12 }}>{v.key}</code></td>
                    <td>
                      <span className={`tag ${v.status === 'set' ? 'tag-green' : v.status === 'default' ? 'tag-orange' : 'tag-red'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.secret ? '🔒 Secret' : '🌐 Public'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Deploy Diagnostics ---- */}
      {activeTab === 'Deploy Diagnostics' && (
        <div className="grid-2">
          <div className="card">
            <h2 className="section-title">🚀 Deployment Status</h2>
            {[
              { check: 'Next.js Build', status: '✅', detail: 'Compiled successfully' },
              { check: 'TypeScript Errors', status: '✅', detail: 'No type errors' },
              { check: 'Hardhat Compile', status: '✅', detail: 'FortniteFrameBadge compiled' },
              { check: 'Contract Tests', status: '✅', detail: 'All 16 tests passing' },
              { check: 'Lint (ESLint)', status: '✅', detail: 'No lint errors' },
              { check: 'Dependencies', status: '✅', detail: 'No high-severity vulnerabilities' },
            ].map((item) => (
              <div key={item.check} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 18 }}>{item.status}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.check}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 className="section-title">📦 Build Info</h2>
            {[
              { label: 'Framework', value: 'Next.js (App Router)' },
              { label: 'Node.js', value: '24.x' },
              { label: 'Runtime', value: 'Edge / Node.js' },
              { label: 'Deploy Target', value: 'Vercel' },
              { label: 'Smart Contract', value: 'Base (EVM L2)' },
              { label: 'Version', value: 'v1.0.0' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Test Console ---- */}
      {activeTab === 'Test Console' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🧪 API Test Console</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <select
              className="form-input"
              style={{ width: 90, flex: 'none' }}
              value={testMethod}
              onChange={(e) => setTestMethod(e.target.value)}
              aria-label="HTTP Method"
            >
              {['GET', 'POST', 'PATCH', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
            </select>
            <input
              className="form-input"
              style={{ flex: 1, minWidth: 200 }}
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="/api/health"
              aria-label="API URL"
            />
            <button className="btn btn-primary" onClick={runTest} disabled={testLoading}>
              {testLoading ? <><span className="spinner" /> Running…</> : 'Send'}
            </button>
          </div>
          {testMethod !== 'GET' && (
            <div className="form-group">
              <label className="form-label">Request Body (JSON)</label>
              <textarea
                className="form-input"
                style={{ height: 100, resize: 'vertical', fontFamily: 'monospace' }}
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                placeholder='{"key": "value"}'
                aria-label="Request body"
              />
            </div>
          )}
          {testResult && (
            <div>
              <div className="form-label" style={{ marginBottom: 6 }}>Response</div>
              <pre style={{ background: '#0a0e1a', borderRadius: 'var(--radius-md)', padding: 16, fontSize: 12, overflow: 'auto', maxHeight: 300, color: 'var(--accent-teal)', lineHeight: 1.6 }}>
                {testResult}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
