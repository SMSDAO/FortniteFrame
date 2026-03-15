'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        return;
      }

      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);

      // Redirect by role
      if (data.user.role === 'Admin') {
        router.push('/admin');
      } else if (data.user.role === 'Developer') {
        router.push('/developer');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <h1 className="login-title glow-text">🎮 FortniteFrame</h1>
        <p className="login-subtitle">Sign in to your enterprise account</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fortniteframe.app"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !email || !password}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Demo credentials</p>
          <p>Admin: admin@fortniteframe.app / admin123</p>
          <p>Dev: dev@fortniteframe.app / dev123</p>
          <p>User: user@fortniteframe.app / user123</p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--accent-primary)' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
