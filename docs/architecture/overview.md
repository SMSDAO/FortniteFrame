# FortniteFrame Architecture

## Overview

FortniteFrame is a Next.js 16 (App Router) + Hardhat monolith targeting Vercel deployment with a smart contract on the Base blockchain.

## Frontend

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: Neo-Glow dark design system (`src/app/globals.css`)
- **State**: React `useState` / `useEffect` (no external state library)
- **Wallet**: `wagmi` v2 + `viem` v2 + `@farcaster/frame-sdk`

## Backend (Next.js API Routes)

| Route | Auth | Role |
|-------|------|------|
| `POST /api/auth/login` | None | — |
| `POST /api/auth/logout` | None | — |
| `GET /api/auth/me` | Bearer JWT | Any |
| `GET /api/fortnite` | None | — |
| `GET /api/health` | None | — |
| `GET /api/metrics` | Bearer JWT | Developer+ |
| `GET|POST /api/billing` | Bearer JWT | User (own), Admin (all) |
| `GET|POST|PATCH /api/admin/users` | Bearer JWT | Admin |

## Authentication & RBAC

- Passwords hashed with **bcrypt** (10 rounds)
- **JWT access tokens** (15 min TTL) signed with `JWT_SECRET`
- **Refresh tokens** (7 day TTL) in `httpOnly, secure, sameSite=strict` cookies
- Four roles: **Admin**, **Developer**, **User**, **Auditor**

## Database

Currently uses an in-memory data layer (`src/lib/db.ts`) for demo/development.

For production, wire `DATABASE_URL` (PostgreSQL) and migrate to Prisma:

```bash
npm install prisma @prisma/client
npx prisma init
# Edit prisma/schema.prisma
npx prisma migrate dev
```

## Smart Contract

`contracts/FortniteFrameBadge.sol` — EIP-712 signed badge minting on Base (EVM L2).

- OpenZeppelin `Ownable`, `ReentrancyGuard`, `Pausable`
- Platform fee routing to `reserveWallet`
- Nonce-based signature replay protection

## Security

- **Security headers**: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`
- **Input validation**: Zod schemas on all auth/admin API routes
- **Secrets**: Never committed; managed via `.env` / Vercel environment variables

## CI/CD

- `.github/workflows/ci.yml` — lint + typecheck, Next.js build, Hardhat compile + test, npm audit + CodeQL
- `.github/workflows/release.yml` — full build + test + GitHub Release on `v*.*.*` tag
