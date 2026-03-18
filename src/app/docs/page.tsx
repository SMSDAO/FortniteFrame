'use client';

import Link from 'next/link';

const DOC_SECTIONS = [
  {
    icon: '🏗️',
    title: 'Architecture',
    description: 'Overview of the Next.js + Hardhat monolith, API routes, and smart contract design.',
    href: '#architecture',
  },
  {
    icon: '🚀',
    title: 'Deployment',
    description: 'Deploying to Vercel, environment variable setup, and Base network contract deployment.',
    href: '#deployment',
  },
  {
    icon: '🔑',
    title: 'Environment Variables',
    description: 'Reference for all required and optional environment variables.',
    href: '#env-vars',
  },
  {
    icon: '👤',
    title: 'User Guide',
    description: 'How to fetch Fortnite stats, connect a wallet, and mint achievement badges.',
    href: '#user-guide',
  },
  {
    icon: '⚙️',
    title: 'Admin Guide',
    description: 'User management, role assignment, billing controls, and audit logging.',
    href: '#admin-guide',
  },
  {
    icon: '🛠️',
    title: 'Developer Guide',
    description: 'API reference, integration guide, smart contract interface, and local development.',
    href: '#developer-guide',
  },
];

export default function DocsPage() {
  return (
    <div className="fade-in">
      <h1 className="page-title">📖 Documentation</h1>
      <p className="page-subtitle">FortniteFrame v1.0.0 — Enterprise Platform Docs</p>

      <div className="grid-3" style={{ marginBottom: 32 }}>
        {DOC_SECTIONS.map((s) => (
          <a key={s.title} href={s.href} className="card" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{s.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.description}</p>
          </a>
        ))}
      </div>

      {/* Architecture */}
      <section id="architecture" style={{ marginBottom: 40 }}>
        <h2 className="section-title">🏗️ Architecture</h2>
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            FortniteFrame is a Next.js App Router application co-located with a Hardhat smart contract project targeting the Base blockchain.
          </p>
          <pre style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, fontSize: 12, overflow: 'auto', color: 'var(--accent-teal)', lineHeight: 1.8 }}>
{`FortniteFrame/
├── .github/workflows/      # CI/CD pipelines (ci.yml, release.yml)
├── contracts/              # Solidity smart contracts (Base)
│   └── FortniteFrameBadge.sol
├── scripts/                # Hardhat deployment scripts
├── test/                   # Hardhat contract tests (Mocha + Chai)
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── page.tsx        # Home / Farcaster Frame UI
│   │   ├── login/          # Authentication page
│   │   ├── dashboard/      # User dashboard (RBAC: all)
│   │   ├── admin/          # Admin dashboard (RBAC: Admin)
│   │   ├── developer/      # Developer dashboard (RBAC: Dev+)
│   │   ├── docs/           # Documentation page
│   │   └── api/            # Next.js API routes
│   │       ├── auth/       # login / logout / me
│   │       ├── fortnite/   # Fortnite stats proxy
│   │       ├── health/     # Health check endpoint
│   │       ├── metrics/    # System metrics (auth)
│   │       ├── billing/    # Billing records
│   │       └── admin/      # Admin-only routes
│   ├── components/         # Shared React components
│   │   └── Navigation.tsx  # Tab navigation bar
│   └── lib/                # Shared utilities
│       ├── auth.ts         # JWT + RBAC utilities
│       ├── db.ts           # In-memory data layer
│       └── fortnite.ts     # Fortnite API client
├── docs/                   # Static documentation
├── .env.example            # Environment template
└── CHANGELOG.md            # Version history`}
          </pre>
        </div>
      </section>

      {/* Deployment */}
      <section id="deployment" style={{ marginBottom: 40 }}>
        <h2 className="section-title">🚀 Deployment</h2>
        <div className="card">
          <h3 style={{ color: 'var(--accent-primary)', marginBottom: 12, fontSize: 15 }}>Vercel (Frontend)</h3>
          <ol style={{ color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: 20, fontSize: 14 }}>
            <li>Import the repository into Vercel.</li>
            <li>Set required environment variables (see below).</li>
            <li>Deploy — Vercel auto-detects Next.js.</li>
          </ol>
          <h3 style={{ color: 'var(--accent-primary)', margin: '20px 0 12px', fontSize: 15 }}>Smart Contract (Base Network)</h3>
          <pre style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, fontSize: 12, color: 'var(--accent-teal)' }}>
{`# 1. Set env vars
cp .env.example .env
# Edit .env: set PRIVATE_KEY, BASE_RPC_URL, AUTHORIZED_RELAYER, BASESCAN_API_KEY

# 2. Deploy contract
npm run deploy:baseSepolia   # Testnet
npm run deploy:base          # Mainnet

# 3. Verify contract
npm run verify:contract

# 4. Set NEXT_PUBLIC_CONTRACT_ADDRESS in your deployment env`}
          </pre>
        </div>
      </section>

      {/* Environment Variables */}
      <section id="env-vars" style={{ marginBottom: 40 }}>
        <h2 className="section-title">🔑 Environment Variables</h2>
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'FORTNITE_API_KEY', req: '✅', desc: 'API key from replayinfo.com for Fortnite stats' },
                  { key: 'JWT_SECRET', req: '✅', desc: 'Secret for signing JWT tokens (min 32 chars)' },
                  { key: 'ADMIN_PASSWORD', req: '⚠️', desc: 'Initial admin password (default: admin123 — change in production)' },
                  { key: 'DATABASE_URL', req: '⚠️', desc: 'PostgreSQL URL for production (optional in dev)' },
                  { key: 'NEXT_PUBLIC_CONTRACT_ADDRESS', req: '⚠️', desc: 'Deployed FortniteFrameBadge contract address' },
                  { key: 'NEXT_PUBLIC_RPC_URL', req: '⚠️', desc: 'Base RPC endpoint (defaults to public node)' },
                  { key: 'PRIVATE_KEY', req: '🔧', desc: 'Wallet private key for contract deployment only' },
                  { key: 'AUTHORIZED_RELAYER', req: '🔧', desc: 'Backend signer address for badge verification' },
                  { key: 'BASE_RPC_URL', req: '🔧', desc: 'Base mainnet RPC URL for deployment' },
                  { key: 'BASE_SEPOLIA_RPC_URL', req: '🔧', desc: 'Base Sepolia testnet RPC URL' },
                  { key: 'BASESCAN_API_KEY', req: '🔧', desc: 'For contract verification on Basescan' },
                ].map((v) => (
                  <tr key={v.key}>
                    <td><code style={{ color: 'var(--accent-teal)', fontSize: 12 }}>{v.key}</code></td>
                    <td>{v.req}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{v.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            ✅ Required for production &nbsp; ⚠️ Required / recommended &nbsp; 🔧 Deployment only
          </p>
        </div>
      </section>

      {/* User Guide */}
      <section id="user-guide" style={{ marginBottom: 40 }}>
        <h2 className="section-title">👤 User Guide</h2>
        <div className="card">
          <ol style={{ color: 'var(--text-secondary)', lineHeight: 2.2, paddingLeft: 20, fontSize: 14 }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>Sign In</strong> — Navigate to <Link href="/login" style={{ color: 'var(--accent-primary)' }}>/login</Link> and enter your credentials.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>View Dashboard</strong> — After login, go to <Link href="/dashboard" style={{ color: 'var(--accent-primary)' }}>/dashboard</Link> to see your usage, activity, and notifications.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Fetch Fortnite Stats</strong> — On the home page, enter a Fortnite username and click &quot;Fetch Stats&quot;.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Connect Wallet</strong> — Click &quot;Connect Wallet&quot; to connect your crypto wallet via the Frame SDK.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Mint Badge</strong> — After fetching stats, click &quot;Mint Badge&quot; to create an on-chain achievement NFT on Base.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Monitor Usage</strong> — The metered usage panel on your dashboard shows API call consumption vs. your limit.</li>
          </ol>
        </div>
      </section>

      {/* Admin Guide */}
      <section id="admin-guide" style={{ marginBottom: 40 }}>
        <h2 className="section-title">⚙️ Admin Guide</h2>
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 14 }}>
            Access the <Link href="/admin" style={{ color: 'var(--accent-primary)' }}>Admin Dashboard</Link> with an Admin account.
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 2.2, paddingLeft: 20, fontSize: 14 }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>User Management</strong> — Create users, assign roles (Admin/Developer/User/Auditor), view usage.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Billing Controls</strong> — View billing records, monitor per-user metered usage, set limits.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Audit Logs</strong> — View all system actions with timestamps and IP addresses.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>API Monitoring</strong> — Real-time status of all API endpoints.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Configuration</strong> — View platform settings and environment variable status.</li>
          </ul>
        </div>
      </section>

      {/* Developer Guide */}
      <section id="developer-guide" style={{ marginBottom: 40 }}>
        <h2 className="section-title">🛠️ Developer Guide</h2>
        <div className="card">
          <h3 style={{ color: 'var(--accent-primary)', marginBottom: 12, fontSize: 15 }}>Local Development</h3>
          <pre style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, fontSize: 12, color: 'var(--accent-teal)', marginBottom: 16 }}>
{`npm install         # Install dependencies
npm run dev         # Start Next.js dev server
npm run compile     # Compile smart contracts
npm run test:contract  # Run Hardhat tests
npm run lint        # Run ESLint
npx tsc --noEmit    # Type check`}
          </pre>
          <h3 style={{ color: 'var(--accent-primary)', marginBottom: 12, fontSize: 15 }}>API Authentication</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 10 }}>
            Most API routes require a Bearer token. Obtain one via POST /api/auth/login.
          </p>
          <pre style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, fontSize: 12, color: 'var(--accent-teal)' }}>
{`# Login
POST /api/auth/login
{"email": "dev@fortniteframe.app", "password": "dev123"}
→ {"user": {...}, "accessToken": "eyJ..."}

# Use token
GET /api/metrics
Authorization: Bearer eyJ...`}
          </pre>
        </div>
      </section>
    </div>
  );
}
