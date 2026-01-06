'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import { createConfig, http, useAccount, useConnect, useSendTransaction, WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { parseEther } from 'viem';
import axios from 'axios';

// Configure Wagmi
const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

interface PlayerStats {
  username: string;
  wins: number;
  kills: number;
  matches: number;
  winRate: string;
}

function FrameContent() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { sendTransaction, isPending, isSuccess } = useSendTransaction();

  // Initialize Farcaster Frame SDK
  useEffect(() => {
    const initFrame = async () => {
      try {
        const context = await sdk.context;
        setIsSDKLoaded(true);
        console.log('Frame SDK loaded', context);
        
        // You can access user info from context
        if (context.user?.username) {
          setUsername(context.user.username);
        }
      } catch (error) {
        console.error('Error loading Frame SDK:', error);
      }
    };

    initFrame();
  }, []);

  // Fetch player stats
  const fetchStats = async () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/fortnite?user=${encodeURIComponent(username)}`);
      setStats(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  // Handle wallet connection
  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  // Handle mint badge transaction
  const handleMintBadge = () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    // TODO: Replace with actual NFT contract address before production deployment
    // This is a placeholder address for demonstration purposes
    const contractAddress = '0x0000000000000000000000000000000000000000';
    
    if (contractAddress === '0x0000000000000000000000000000000000000000') {
      alert('⚠️ Contract address not configured. Please set a valid NFT contract address in the code.');
      return;
    }

    // Send a transaction (example: sending 0.001 ETH to a contract)
    // In a real scenario, this would be a contract interaction to mint an NFT badge
    sendTransaction({
      to: contractAddress,
      value: parseEther('0.001'),
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎮 FortniteFrame</h1>
        <p style={styles.subtitle}>Farcaster Frame v2 with Fortnite Stats</p>

        {/* SDK Status */}
        <div style={styles.status}>
          {isSDKLoaded ? '✅ Frame SDK Ready' : '⏳ Loading Frame SDK...'}
        </div>

        {/* Username Input */}
        <div style={styles.section}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter Fortnite username"
            style={styles.input}
          />
          <button
            onClick={fetchStats}
            disabled={loading || !username}
            style={styles.button}
          >
            {loading ? 'Loading...' : 'Fetch Stats'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* Stats Display */}
        {stats && (
          <div style={styles.statsCard}>
            <h2 style={styles.statsTitle}>Player Stats: {stats.username}</h2>
            <div style={styles.statGrid}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Wins:</span>
                <span style={styles.statValue}>{stats.wins}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Kills:</span>
                <span style={styles.statValue}>{stats.kills}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Matches:</span>
                <span style={styles.statValue}>{stats.matches}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Win Rate:</span>
                <span style={styles.statValue}>{stats.winRate}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Smart Wallet</h3>
          {!isConnected ? (
            <button onClick={handleConnect} style={styles.button}>
              Connect Wallet
            </button>
          ) : (
            <div>
              <p style={styles.walletInfo}>
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <button
                onClick={handleMintBadge}
                disabled={isPending || !stats}
                style={{
                  ...styles.button,
                  ...styles.mintButton,
                }}
              >
                {isPending ? 'Minting...' : isSuccess ? '✅ Badge Minted!' : '🎖️ Mint Badge'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Page Component with Providers
export default function Page() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FrameContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#1a202c',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '16px',
    color: '#718096',
    textAlign: 'center' as const,
    margin: '0 0 24px 0',
  },
  status: {
    padding: '12px',
    background: '#f7fafc',
    borderRadius: '8px',
    textAlign: 'center' as const,
    marginBottom: '24px',
    color: '#2d3748',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#2d3748',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '12px',
    boxSizing: 'border-box' as const,
  },
  button: {
    width: '100%',
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  mintButton: {
    background: '#48bb78',
  },
  error: {
    padding: '12px',
    background: '#fed7d7',
    color: '#c53030',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  statsCard: {
    background: '#f7fafc',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  statsTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#2d3748',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  statLabel: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2d3748',
  },
  walletInfo: {
    padding: '12px',
    background: '#f7fafc',
    borderRadius: '8px',
    marginBottom: '12px',
    textAlign: 'center' as const,
    color: '#2d3748',
  },
};
