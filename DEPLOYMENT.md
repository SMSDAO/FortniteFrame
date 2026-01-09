# Deployment Guide

## Prerequisites

Before deploying FortniteFrame, ensure you have:

1. A [Vercel account](https://vercel.com/signup) for frontend deployment
2. A [Fortnite Replay Info API key](https://replayinfo.com)
3. Your GitHub repository connected to Vercel
4. ETH on Base network for smart contract deployment (optional)
5. A wallet with private key for contract deployment (optional)

## Part 1: Smart Contract Deployment (Base Blockchain)

### Prerequisites for Smart Contract

1. **Install Dependencies**:
```bash
npm install
```

2. **Configure Environment Variables**:

Copy `.env.example` to `.env` and configure:

```bash
# Required for contract deployment
PRIVATE_KEY=your-wallet-private-key
RESERVE_WALLET=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb  # gxqstudio.eth
PLATFORM_FEE_BPS=250  # 2.5%
AUTHORIZED_RELAYER=your-backend-signer-address
BASESCAN_API_KEY=your-basescan-api-key

# RPC URLs (defaults provided)
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### Deploy Smart Contract

#### Step 1: Compile Contract

```bash
npm run compile
```

This will compile the `FortniteFrameBadge.sol` contract.

#### Step 2: Deploy to Base Sepolia (Testnet)

For testing:

```bash
npm run deploy:baseSepolia
```

#### Step 3: Deploy to Base Mainnet (Production)

For production:

```bash
npm run deploy:base
```

The deployment script will output:
- Contract address
- Deployment transaction hash
- Configuration details
- Verification command

#### Step 4: Verify Contract

After deployment, verify on Basescan:

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> "<RESERVE_WALLET>" <PLATFORM_FEE_BPS> "<AUTHORIZED_RELAYER>"
```

Example:
```bash
npx hardhat verify --network base 0x123abc... "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" 250 "0x456def..."
```

### Testing Smart Contract

Run comprehensive tests:

```bash
npm run test:contract
```

See `contracts/README.md` for detailed contract documentation.

## Part 2: Frontend Deployment (Vercel)

### 1. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your FortniteFrame GitHub repository
4. Vercel will automatically detect it's a Next.js project

### 2. Configure Environment Variables

In your Vercel project settings, add the following environment variable:

- **Variable Name**: `FORTNITE_API_KEY`
- **Value**: Your API key from https://replayinfo.com
- **Environment**: Production, Preview, Development (select all)

### 3. Deploy

Click "Deploy" and Vercel will:
- Install dependencies
- Run the build command
- Deploy your application

Your app will be live at: `https://your-project.vercel.app`

## Post-Deployment

### Testing Your Deployment

1. Visit your deployed URL
2. Enter a Fortnite username and click "Fetch Stats"
3. Test the Smart Wallet connection
4. Verify the API endpoint: `https://your-project.vercel.app/api/fortnite?user=test`

### Running the Health Monitor

To monitor your deployment, run locally:

```bash
DEPLOYMENT_URL=https://your-project.vercel.app npm run heal
```

This will:
- Check your API endpoint every 60 seconds
- Log health status
- Alert on failures
- Simulate healing actions

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `FORTNITE_API_KEY` | Yes | API key for Fortnite Replay Info | `your-key-here` |
| `DEPLOYMENT_URL` | No | URL for health monitoring | `https://yourapp.vercel.app` |

## Configuration for Smart Wallet

⚠️ **Important**: Before using the "Mint Badge" feature in production:

1. Deploy your NFT smart contract to the Base network
2. Update the contract address in `src/app/page.tsx` (line ~100)
3. Replace `0x0000000000000000000000000000000000000000` with your contract address
4. Implement the actual minting logic using your contract ABI

Example:
```typescript
const contractAddress = '0xYourContractAddress' as `0x${string}`;
```

## Vercel Configuration

The project includes a `vercel.json` file with optimal settings:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

No additional configuration needed!

## Troubleshooting

### Build Fails

- **Check Node.js version**: Vercel uses Node 18+ by default
- **Verify dependencies**: Ensure all packages are in `package.json`
- **Check build logs**: Look for TypeScript or compilation errors

### API Returns Errors

- **Verify API key**: Check that `FORTNITE_API_KEY` is set correctly
- **Check API limits**: Ensure you haven't exceeded rate limits
- **Test locally**: Run `npm run dev` and test the API route

### Wallet Connection Issues

- **Check network**: Ensure you're on the Base network
- **Browser compatibility**: Use a modern browser with wallet support
- **Clear cache**: Try clearing browser cache and reconnecting

## Performance Optimization

The project is already optimized for Vercel:

- ✅ Static generation where possible
- ✅ API routes with dynamic rendering
- ✅ Minimal bundle size
- ✅ Fast page loads

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in your project settings for:
- Page views
- Performance metrics
- Error tracking

### Custom Health Monitoring

Use the included `auto-heal.ts` script:

```bash
# Run continuously
npm run heal

# Or set up as a cron job
*/5 * * * * cd /path/to/project && npm run heal
```

## Security Notes

✅ No sensitive data in client code
✅ API keys stored in environment variables
✅ Zero-address protection on transactions
✅ No hardcoded secrets

## Support

For issues:
1. Check the [README.md](README.md)
2. Review [Next.js documentation](https://nextjs.org/docs)
3. Check [Vercel documentation](https://vercel.com/docs)
4. Review [Farcaster Frame SDK docs](https://docs.farcaster.xyz)

## Updates

To update your deployment:
1. Push changes to your GitHub repository
2. Vercel automatically deploys from the main branch
3. Preview deployments are created for pull requests

---

🎮 **Happy deploying!** Your FortniteFrame is ready to go live!
