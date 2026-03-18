# Changelog

All notable changes to FortniteFrame are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-03-15

### Added
- **Enterprise RBAC authentication** — JWT-based login with bcrypt password hashing, refresh token cookies, and role-based access control (Admin, Developer, User, Auditor)
- **User Dashboard** (`/dashboard`) — Account overview, activity feed, notifications center, metered usage panel, and account settings
- **Admin Dashboard** (`/admin`) — System overview, user management (create/list/role-update), billing controls, API monitoring, audit logs, and platform configuration tabs
- **Developer Dashboard** (`/developer`) — API endpoint monitoring, structured log viewer with level filtering, environment variable manager, deployment diagnostics, and integration test console
- **Docs page** (`/docs`) — Inline documentation: architecture map, deployment guide, environment variable reference, user guide, admin guide, developer guide
- **Neo-Glow Design System** (`globals.css`) — Dark-theme design system with gradient accents, glow effects, smooth transitions, responsive grid layouts, and mobile-friendly navigation
- **Tab navigation** (`Navigation.tsx`) — Sticky top nav with role-aware tab visibility, avatar/role badge, keyboard-accessible links, and mobile scroll support
- **API routes**:
  - `POST /api/auth/login` — credential validation, JWT issuance, audit logging
  - `POST /api/auth/logout` — refresh token cookie clear
  - `GET /api/auth/me` — current user profile (auth required)
  - `GET /api/health` — public health/uptime endpoint
  - `GET /api/metrics` — system metrics (Developer+ role)
  - `GET|POST /api/billing` — billing records with role scoping
  - `GET|POST|PATCH /api/admin/users` — user CRUD and role management (Admin role)
- **In-memory data layer** (`src/lib/db.ts`) — Demo-grade user store, audit log, billing records, and metrics; swap for Prisma + PostgreSQL via `DATABASE_URL`
- **Security headers** (`next.config.js`) — CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- **CI/CD workflows** (`.github/workflows/`):
  - `ci.yml` — lint + typecheck, Next.js build, Hardhat compile + test, security/dependency scan (runs on push and PR)
  - `release.yml` — build + test + GitHub Release creation (runs on `v*.*.*` tag push)
- **CHANGELOG.md** — this file
- **Updated `.env.example`** — full reference for all environment variables including auth, DB, and contract deployment

### Changed
- `next.config.js` — added `compress: true`, `poweredByHeader: false`, and `async headers()` for security
- `src/app/layout.tsx` — imports global CSS, mounts `<Navigation />`, updated metadata
- `package.json` — added `bcryptjs`, `jsonwebtoken`, `zod` runtime deps; added `@types/bcryptjs`, `@types/jsonwebtoken` dev deps

### Fixed
- Build pipeline: CI workflow now passes correct test environment variables (`FORTNITE_API_KEY`, `NEXT_PUBLIC_CONTRACT_ADDRESS`, `JWT_SECRET`, `NEXTAUTH_URL`) for build step
- TypeScript: all new API routes and components use strict typing with no implicit `any`

### Security
- Passwords hashed with bcrypt (10 rounds)
- JWT access tokens expire in 15 minutes; refresh tokens in 7 days (httpOnly, secure, sameSite=strict cookies)
- Input validation on all auth and admin routes via Zod schemas
- Security headers added to all responses
- Admin-only routes enforce role check server-side; errors return opaque 401/403 responses

## [0.1.0] — Initial Release

### Added
- Farcaster Frame v2 integration (`@farcaster/frame-sdk`)
- Fortnite player stats fetching (`fortnite-replay-info`)
- Smart wallet integration (`wagmi` + `viem`)
- FortniteFrameBadge EIP-712 smart contract (Base network)
- Hardhat test suite with 16 contract tests
- Next.js App Router with basic UI
- Vercel deployment configuration
- Auto-heal monitoring script
