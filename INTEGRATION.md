# Smart Contract Integration Guide

This guide explains how to integrate the FortniteFrameBadge smart contract with the Farcaster Frame v2 frontend.

## Overview

The integration requires:
1. A deployed FortniteFrameBadge contract on Base
2. A backend service to generate EIP-712 signatures
3. Frontend updates to call the contract with proper parameters

## Architecture

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Frontend  │──────▶│   Backend    │──────▶│  Fortnite   │
│  (Frame v2) │       │   (Relayer)  │       │     API     │
└──────┬──────┘       └──────┬───────┘       └─────────────┘
       │                     │
       │   1. Request        │   2. Generate
       │      Badge          │      Signature
       │                     │
       │◀────────────────────┤
       │   3. Return Signature
       │
       ▼
┌─────────────┐
│   Smart     │
│  Contract   │
│  (Base L2)  │
└─────────────┘
    4. Mint Badge
```

## Step 1: Deploy Contract

Deploy the FortniteFrameBadge contract to Base:

```bash
npm run deploy:base
```

Save the deployed contract address and update your `.env`:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
```

## Step 2: Create Backend Signature Service

Create a backend endpoint to generate EIP-712 signatures for badge minting.

### Example Backend (Node.js/Express)

```javascript
const express = require('express');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());

// Configuration
const PRIVATE_KEY = process.env.AUTHORIZED_RELAYER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CHAIN_ID = 8453; // Base mainnet

const signer = new ethers.Wallet(PRIVATE_KEY);

// EIP-712 Domain
const domain = {
  name: 'FortniteFrameBadge',
  version: '1',
  chainId: CHAIN_ID,
  verifyingContract: CONTRACT_ADDRESS,
};

// EIP-712 Types
const types = {
  MintBadge: [
    { name: 'recipient', type: 'address' },
    { name: 'fortniteHash', type: 'bytes32' },
    { name: 'priceWei', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
};

app.post('/api/generate-badge-signature', async (req, res) => {
  try {
    const { recipient, fortniteUsername, nonce } = req.body;

    // Validate input
    if (!ethers.isAddress(recipient)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }

    // Fetch Fortnite stats (simplified)
    const fortniteStats = await fetchFortniteStats(fortniteUsername);
    
    // Validate stats exist and meet badge criteria
    if (!fortniteStats || typeof fortniteStats.wins !== 'number') {
      return res.status(400).json({ 
        error: 'Failed to fetch valid Fortnite stats'
      });
    }
    
    if (fortniteStats.wins < 10) {
      return res.status(400).json({ 
        error: 'Insufficient stats for badge',
        required: { wins: 10 },
        current: fortniteStats
      });
    }

    // Generate hash of Fortnite stats
    const fortniteHash = ethers.keccak256(
      ethers.solidityPacked(
        ['string', 'uint256', 'uint256'],
        [fortniteUsername, fortniteStats.wins, fortniteStats.kills]
      )
    );

    // Set price and deadline
    const priceWei = ethers.parseEther('0.001'); // 0.001 ETH
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    // Validate and convert nonce to BigInt
    const nonceValue = typeof nonce === 'number' ? nonce : parseInt(nonce, 10);
    if (isNaN(nonceValue)) {
      return res.status(400).json({ error: 'Invalid nonce value' });
    }

    // Create signature value
    const value = {
      recipient,
      fortniteHash,
      priceWei,
      deadline,
      nonce: BigInt(nonceValue),
    };

    // Sign the typed data
    const signature = await signer.signTypedData(domain, types, value);

    // Return signature and parameters
    res.json({
      success: true,
      signature,
      params: {
        recipient,
        fortniteHash,
        priceWei: priceWei.toString(),
        deadline,
        nonce,
      },
      stats: fortniteStats,
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
});

async function fetchFortniteStats(username) {
  // Implementation depends on your Fortnite API client or Next.js API route.
  // If this Express backend runs separately from your Next.js app,
  // use the full URL to your stats endpoint instead of a relative path.
  const response = await fetch(`https://your-nextjs-app.com/api/fortnite?user=${username}`);
  return response.json();
}

app.listen(3001, () => {
  console.log('Signature service running on port 3001');
});
```

## Step 3: Update Frontend to Call Contract

Update `src/app/page.tsx` to integrate with the contract:

```typescript
import { useWriteContract, useReadContract } from 'wagmi';

// Contract ABI (add to your project)
const FORTNITE_FRAME_BADGE_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "bytes32", "name": "fortniteHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "priceWei", "type": "uint256" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" },
      { "internalType": "bytes", "name": "backendSignature", "type": "bytes" }
    ],
    "name": "mintBadge",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getNonce",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

function FrameContent() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  // Read current nonce for the user
  const { data: nonce } = useReadContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    abi: FORTNITE_FRAME_BADGE_ABI,
    functionName: 'getNonce',
    args: [address],
  });

  const handleMintBadge = async () => {
    if (!address || !stats) {
      alert('Please connect wallet and fetch stats first');
      return;
    }

    try {
      // Call backend to get signature
      const response = await fetch('/api/generate-badge-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: address,
          fortniteUsername: stats.username,
          nonce: nonce?.toString() || '0',
        }),
      });

      const { signature, params } = await response.json();

      // Validate contract address exists
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        alert('Contract address not configured');
        return;
      }

      // Call smart contract
      const result = await writeContract({
        address: contractAddress,
        abi: FORTNITE_FRAME_BADGE_ABI,
        functionName: 'mintBadge',
        args: [
          params.recipient,
          params.fortniteHash,
          BigInt(params.priceWei),
          params.deadline,
          signature,
        ],
        value: BigInt(params.priceWei),
      });

      console.log('Badge minted!', result);
      alert('🎉 Badge minted successfully!');
    } catch (error) {
      console.error('Mint failed:', error);
      alert('Failed to mint badge: ' + error.message);
    }
  };

  // Rest of your component...
}
```

## Step 4: Create Contract ABI File

Create `src/lib/contracts/FortniteFrameBadgeABI.ts`:

```typescript
export const FortniteFrameBadgeABI = [
  // Copy the full ABI from artifacts/contracts/FortniteFrameBadge.sol/FortniteFrameBadge.json
  // after running npm run compile
] as const;
```

After compiling the contract, the ABI can be found at:
```
artifacts/contracts/FortniteFrameBadge.sol/FortniteFrameBadge.json
```

## Step 5: Add Backend Endpoint to Next.js

Create `src/app/api/generate-signature/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function POST(request: NextRequest) {
  try {
    const { recipient, fortniteUsername, nonce } = await request.json();

    // Validate
    if (!ethers.isAddress(recipient)) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400 }
      );
    }

    // Implementation similar to Express example above
    // ...

    return NextResponse.json({
      success: true,
      signature,
      params,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Signature generation failed' },
      { status: 500 }
    );
  }
}
```

## Security Considerations

1. **Backend Validation**: Always validate Fortnite stats on the backend before signing
2. **Rate Limiting**: Implement rate limiting on signature endpoint
3. **Nonce Management**: Track nonces to prevent replay attacks
4. **Signature Expiration**: Set reasonable deadlines (e.g., 1 hour)
5. **Price Validation**: Verify payment amount matches signed price

## Testing

1. Deploy contract to Base Sepolia testnet
2. Test signature generation endpoint
3. Test full mint flow from frontend
4. Verify badge ownership on-chain
5. Test edge cases (expired signatures, insufficient payment, etc.)

## Production Checklist

- [ ] Contract deployed and verified on Base mainnet
- [ ] NEXT_PUBLIC_CONTRACT_ADDRESS set in Vercel
- [ ] Backend signature service deployed and secured
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] Gas optimization validated
- [ ] Frontend UX polished
- [ ] Documentation updated

## Troubleshooting

### "Invalid signature" error
- Verify AUTHORIZED_RELAYER address matches backend signer
- Check EIP-712 domain parameters match exactly
- Ensure nonce is current and hasn't been used

### Transaction reverts
- Check msg.value >= priceWei
- Verify signature hasn't expired
- Ensure user doesn't already have the badge

### Gas estimation fails
- Verify contract is not paused
- Check all parameters are correct
- Ensure wallet has sufficient ETH balance

## Resources

- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [Base Network Docs](https://docs.base.org)

---

For contract-specific details, see `contracts/README.md`
