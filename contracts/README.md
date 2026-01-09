# FortniteFrameBadge Smart Contract

Production-ready Solidity smart contract for minting Fortnite achievement badges on Base blockchain, integrated with Farcaster Frame v2.

## Overview

The `FortniteFrameBadge` contract is a minimal, secure, and gas-efficient solution for minting achievement badges based on Fortnite player statistics. It features automatic platform fee routing to a reserve wallet (gxqstudio.eth) and backend signature verification.

## Features

- ✅ **EIP-712 Signature Verification**: Secure backend authorization using typed structured data
- ✅ **Automatic Fee Routing**: Platform fees automatically sent to reserve wallet (gxqstudio.eth)
- ✅ **Configurable Fee Structure**: Platform fees up to 10% (in basis points)
- ✅ **Replay Attack Prevention**: Nonce-based signature tracking
- ✅ **Pausable**: Emergency stop functionality
- ✅ **ReentrancyGuard**: Protection against reentrancy attacks
- ✅ **Gas Optimized**: Efficient storage and operations
- ✅ **Admin Controls**: Owner-only functions for configuration updates

## Contract Details

- **Solidity Version**: ^0.8.26
- **License**: MIT
- **Network**: Base (EVM L2)
- **Admin**: gxqstudio.eth

## Architecture

### State Variables

- `reserveWallet`: Address receiving platform fees (default: gxqstudio.eth)
- `platformFeeBps`: Fee in basis points (250 = 2.5%)
- `authorizedRelayer`: Backend signer address for signature verification
- `hasBadge`: Mapping tracking badge ownership
- `usedSignatures`: Prevents signature replay attacks
- `nonces`: User-specific nonce tracking

### Main Functions

#### `mintBadge()`

Primary entrypoint for badge minting from Farcaster Frame v2.

```solidity
function mintBadge(
    address recipient,
    bytes32 fortniteHash,
    uint256 priceWei,
    uint256 deadline,
    bytes calldata backendSignature
) external payable nonReentrant whenNotPaused
```

**Parameters:**
- `recipient`: Address to receive the badge
- `fortniteHash`: Hash of Fortnite player stats (for verification)
- `priceWei`: Minimum price required in wei
- `deadline`: Signature expiration timestamp
- `backendSignature`: EIP-712 signature from authorized relayer

**Requirements:**
- `msg.value >= priceWei`
- Valid signature from authorized relayer
- Signature not expired
- Badge not already minted for this user/hash

#### Admin Functions

- `setReserveWallet(address payable)`: Update reserve wallet
- `setPlatformFeeBps(uint16)`: Update platform fee (max 10%)
- `setAuthorizedRelayer(address)`: Update authorized signer
- `pause()` / `unpause()`: Emergency controls
- `withdraw(address payable, uint256)`: Withdraw contract balance

### Events

```solidity
event BadgeMinted(address indexed user, bytes32 indexed fortniteHash, uint256 price, uint256 fee);
event PlatformFeeTaken(address indexed payer, uint256 amount, uint256 fee, address indexed reserveWallet);
event ReserveWalletUpdated(address indexed oldWallet, address indexed newWallet);
event PlatformFeeUpdated(uint16 oldBps, uint16 newBps);
event AuthorizedRelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
event Withdraw(address indexed to, uint256 amount);
```

## Deployment

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```bash
PRIVATE_KEY=your-deployment-private-key
RESERVE_WALLET=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb  # gxqstudio.eth
PLATFORM_FEE_BPS=250  # 2.5%
AUTHORIZED_RELAYER=your-backend-signer-address
BASESCAN_API_KEY=your-basescan-key
```

### Compile

```bash
npm run compile
```

### Deploy to Base Sepolia (Testnet)

```bash
npm run deploy:baseSepolia
```

### Deploy to Base (Mainnet)

```bash
npm run deploy:base
```

### Verify Contract

After deployment, verify on Basescan:

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> "<RESERVE_WALLET>" <PLATFORM_FEE_BPS> "<AUTHORIZED_RELAYER>"
```

Example:
```bash
npx hardhat verify --network base 0x123... "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" 250 "0x456..."
```

## Integration with Frontend

### Generating Signatures

Backend should generate EIP-712 signatures:

```typescript
const domain = {
  name: 'FortniteFrameBadge',
  version: '1',
  chainId: 8453, // Base mainnet
  verifyingContract: contractAddress,
};

const types = {
  MintBadge: [
    { name: 'recipient', type: 'address' },
    { name: 'fortniteHash', type: 'bytes32' },
    { name: 'priceWei', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
};

const value = {
  recipient: userAddress,
  fortniteHash: hashFortniteStats(stats),
  priceWei: ethers.parseEther('0.001'),
  deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  nonce: await contract.getNonce(userAddress),
};

const signature = await signer.signTypedData(domain, types, value);
```

### Calling from Frontend

```typescript
import { parseEther } from 'viem';
import { useWriteContract } from 'wagmi';

const { writeContract } = useWriteContract();

await writeContract({
  address: contractAddress,
  abi: FortniteFrameBadgeABI,
  functionName: 'mintBadge',
  args: [
    recipientAddress,
    fortniteHash,
    priceWei,
    deadline,
    signature,
  ],
  value: priceWei,
});
```

## Security Considerations

✅ **Audited Pattern**: Uses OpenZeppelin's battle-tested libraries
✅ **Reentrancy Protection**: All payable functions protected
✅ **Signature Replay Prevention**: Nonce and used signature tracking
✅ **Input Validation**: Comprehensive parameter validation
✅ **Emergency Stop**: Pausable functionality for critical situations
✅ **Fee Caps**: Maximum 10% platform fee enforced

## Gas Optimization

- Uses `uint16` for fee basis points (saves storage)
- Minimal storage reads/writes
- Efficient mapping structure
- Immutable domain separator

## Testing

Run contract tests:

```bash
npm run test:contract
```

## Network Details

### Base Mainnet
- Chain ID: 8453
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org

### Base Sepolia Testnet
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org

## Admin Wallet

**Reserve Wallet (gxqstudio.eth):**
- ENS: gxqstudio.eth
- Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

## License

MIT License - See LICENSE file for details

## Support

For contract issues or questions:
1. Review this documentation
2. Check the deployment guide in DEPLOYMENT.md
3. Review Base documentation: https://docs.base.org
4. Review OpenZeppelin docs: https://docs.openzeppelin.com

---

**Status**: Production Ready ✅
**Last Updated**: 2026-01-06
