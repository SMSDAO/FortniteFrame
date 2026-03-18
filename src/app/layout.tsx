import type { Metadata, Viewport } from 'next';
import Navigation from '@/components/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'FortniteFrame — Enterprise Platform',
  description: 'Enterprise Farcaster Frame with Fortnite stats, smart wallet, RBAC, dashboards, and billing.',
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-layout">
        <Navigation />
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}
