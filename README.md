# FortniteFrame

A Farcaster Frame (v2) project that integrates Fortnite game data with smart wallet transactions, optimized for Vercel deployment.

## Features

- 🎮 **Fortnite Stats Integration**: Fetch and display player statistics using the `fortnite-replay-info` library
- 🔗 **Farcaster Frame SDK**: Built with the official `@farcaster/frame-sdk` for seamless Frame v2 integration
- 💰 **Smart Wallet Support**: Integrated with `wagmi` and `viem` for blockchain transactions
- 🎖️ **NFT Badge Minting**: Trigger smart wallet transactions to mint achievement badges
- 🏥 **Auto-Heal Script**: Health monitoring script for Vercel deployments
- ⚡ **Next.js App Router**: Modern Next.js 14 with App Router conventions
- 📱 **Responsive UI**: Clean, user-friendly interface

## Project Structure

```
FortniteFrame/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── fortnite/
│   │   │       └── route.ts          # API endpoint for Fortnite stats
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Main Frame UI
│   ├── lib/
│   │   └── fortnite.ts               # Fortnite API utility
│   └── scripts/
│       └── auto-heal.ts              # Health monitoring script
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Frame.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

### Health Monitoring

Run the auto-heal script to monitor your deployment:

```bash
npm run heal
```

Set the `DEPLOYMENT_URL` environment variable to monitor a specific deployment:

```bash
DEPLOYMENT_URL=https://your-app.vercel.app npm run heal
```

## API Routes

### GET /api/fortnite

Fetch Fortnite player statistics.

**Query Parameters:**
- `user` (required): The Fortnite username

**Example:**
```bash
curl "http://localhost:3000/api/fortnite?user=username"
```

**Response:**
```json
{
  "username": "username",
  "wins": 100,
  "kills": 1500,
  "matches": 500,
  "winRate": "20.00"
}
```

## Deployment

This project is optimized for Vercel deployment:

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Deploy with default settings

## Environment Variables

For production deployment, you may want to set:

- `DEPLOYMENT_URL`: Your production URL for health monitoring

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Farcaster Frame SDK**: Official Frame v2 integration
- **Wagmi & Viem**: Ethereum wallet connection and transactions
- **TanStack Query**: Data fetching and state management
- **Fortnite Replay Info**: Fortnite API integration
- **Axios**: HTTP client

## License

MIT
