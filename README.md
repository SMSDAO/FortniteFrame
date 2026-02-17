# FortniteFrame

A Farcaster Frame (v2) project that integrates Fortnite game data with smart wallet transactions, optimized for Vercel deployment.

## 🎮 Live Demo

![FortniteFrame UI](https://github.com/user-attachments/assets/34c56a3c-fecf-4c9d-b057-bc24803ef780)

> **Production Deployment**: This application is optimized for Vercel with automated CI/CD and environment variable management.

## Features

- 🎮 **Fortnite Stats Integration**: Fetch and display player statistics using the `fortnite-replay-info` library
- 🔗 **Farcaster Frame SDK**: Built with the official `@farcaster/frame-sdk` for seamless Frame v2 integration
- 💰 **Smart Wallet Support**: Integrated with `wagmi` and `viem` for blockchain transactions
- 🎖️ **NFT Badge Minting**: Trigger smart wallet transactions to mint achievement badges via smart contract
- 📝 **Smart Contract**: Production-ready Solidity contract for Base blockchain with EIP-712 signatures
- 🔒 **Secure & Audited**: Uses OpenZeppelin libraries and battle-tested patterns
- 🏥 **Auto-Heal Script**: Health monitoring script for Vercel deployments
- ⚡ **Next.js App Router**: Modern Next.js 14 with App Router conventions
- 📱 **Responsive UI**: Clean, user-friendly interface

## Project Structure

```
FortniteFrame/
├── contracts/
│   ├── FortniteFrameBadge.sol      # Smart contract for badge minting
│   └── README.md                    # Contract documentation
├── scripts/
│   └── deploy.js                    # Contract deployment script
├── test/
│   └── FortniteFrameBadge.test.js  # Contract test suite
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
├── hardhat.config.js                # Hardhat configuration
├── package.json
├── tsconfig.json
├── next.config.js
├── DEPLOYMENT.md                    # Complete deployment guide
└── README.md
```

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Copy the example environment file and add your configuration:

```bash
cp .env.example .env
```

Then edit `.env` and configure:
- **FORTNITE_API_KEY**: Get from [https://replayinfo.com](https://replayinfo.com)
- **NEXT_PUBLIC_CONTRACT_ADDRESS**: Set after deploying the smart contract (optional for frontend-only testing)

For smart contract deployment, also configure:
- **PRIVATE_KEY**: Your wallet private key (for deploying contracts)
- **AUTHORIZED_RELAYER**: Backend signer address for badge verification
- **BASESCAN_API_KEY**: For contract verification on Basescan

### Development

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Frame.

### Smart Contract

#### Compile Contract

```bash
npm run compile
```

#### Test Contract

```bash
npm run test:contract
```

#### Deploy to Base

```bash
# Deploy to Base Sepolia testnet
npm run deploy:baseSepolia

# Deploy to Base mainnet
npm run deploy:base
```

See `contracts/README.md` for detailed contract documentation.

### Build

Build the Next.js application:

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

This project supports deployment on:
- **Vercel**: For the Next.js frontend
- **Base Blockchain**: For the smart contract

See `DEPLOYMENT.md` for complete deployment instructions including:
- Smart contract deployment to Base
- Frontend deployment to Vercel
- Environment variable configuration
- Contract verification

### Quick Vercel Deployment 🚀

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SMSDAO/FortniteFrame)

#### Prerequisites
- Vercel account
- Fortnite API key from [https://replayinfo.com](https://replayinfo.com)

#### Steps:

1. **Click the "Deploy with Vercel" button above**

2. **Configure Environment Variables in Vercel**:
   - `FORTNITE_API_KEY`: Your API key from replayinfo.com
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`: Smart contract address (optional for testing)

3. **Deploy**: Vercel will automatically build and deploy your application

4. **Access**: Your app will be live at `https://your-app.vercel.app`

#### Environment Variable Setup

The following environment variables are required for production:

```bash
# Required
FORTNITE_API_KEY=your-api-key-here

# Optional (for smart contract integration)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

For local development, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Frontend (Vercel)

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Configure environment variables
4. Deploy with default settings

### Smart Contract (Base)

1. Configure `.env` with deployment credentials
2. Run `npm run compile` to compile the contract
3. Run `npm run deploy:base` to deploy to Base mainnet
4. Verify with Basescan using the provided command

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md) and [contracts/README.md](./contracts/README.md).

## Environment Variables

For production deployment, you may want to set:

- `DEPLOYMENT_URL`: Your production URL for health monitoring

## Technologies Used

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Farcaster Frame SDK**: Official Frame v2 integration
- **Wagmi & Viem**: Ethereum wallet connection and transactions
- **TanStack Query**: Data fetching and state management
- **Fortnite Replay Info**: Fortnite API integration
- **Axios**: HTTP client

## CI/CD & Testing

### Continuous Integration

This project includes automated CI/CD via GitHub Actions:

- ✅ **Automated Tests**: Contract tests run on every push
- ✅ **Code Linting**: ESLint checks enforce code quality
- ✅ **Security Scans**: Automated security checks
- ✅ **Build Verification**: Ensures production builds succeed

### Running Tests Locally

```bash
# Run contract tests
npm run test:contract

# Run linting
npm run lint

# Build for production
npm run build
```

### Test Coverage

- **Contract Tests**: 25/25 passing
  - Deployment tests
  - Admin function tests
  - Badge minting tests
  - Withdrawal tests
  - View function tests

## Production Checklist

Before deploying to production, ensure:

- [ ] `FORTNITE_API_KEY` is configured in Vercel
- [ ] Tests pass locally (`npm run test:contract && npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables are set correctly
- [ ] Smart contract is deployed (if using blockchain features)
- [ ] `.env.example` matches your actual environment needs

## License

MIT
