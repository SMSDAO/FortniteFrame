'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavUser {
  name: string;
  role: string;
  email: string;
}

const TABS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin', label: 'Admin', icon: '⚙️', roles: ['Admin'] },
  { href: '/developer', label: 'Developer', icon: '🛠️', roles: ['Admin', 'Developer'] },
  { href: '/docs', label: 'Docs', icon: '📖' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);

  useEffect(() => {
    // Tokens are stored in httpOnly cookies — fetch /me with credentials to use them
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setUser(data))
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    router.push('/login');
  };

  const visibleTabs = TABS.filter((tab) => {
    if (!tab.roles) return true;
    if (!user) return false;
    return tab.roles.includes(user.role);
  });

  return (
    <nav className="nav-bar" role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <Link href="/" className="nav-logo" aria-label="FortniteFrame home">
          🎮 FortniteFrame
        </Link>

        {visibleTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`nav-tab${pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href)) ? ' active' : ''}`}
            aria-current={pathname === tab.href ? 'page' : undefined}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}

        <div className="nav-spacer" />

        <div className="nav-user">
          {user ? (
            <>
              <span className={`nav-role-badge role-${user.role}`}>{user.role}</span>
              <div className="nav-avatar" title={user.email} aria-label={`User: ${user.name}`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleLogout}
                aria-label="Log out"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
