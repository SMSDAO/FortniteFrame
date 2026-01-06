import { Client } from 'fortnite-replay-info';

// Initialize the Fortnite client with API key from environment variable
// Get your API key from https://replayinfo.com
const apiKey = process.env.FORTNITE_API_KEY || 'demo-api-key';
const fortniteClient = new Client(apiKey);

/**
 * Fetches player stats for a specific username
 * @param username - The Fortnite username to fetch stats for
 * @returns Player stats including username, wins, kills, etc.
 */
export async function getPlayerStats(username: string) {
  try {
    // Fetch player stats for the current season/version
    const stats = await fortniteClient.getStats(username, 'current');
    
    // Aggregate stats from all modes
    let totalWins = 0;
    let totalKills = 0;
    let totalMatches = 0;
    
    if (stats?.stats && Array.isArray(stats.stats)) {
      stats.stats.forEach((modeStat) => {
        totalWins += modeStat.wins || 0;
        totalKills += modeStat.kills || 0;
        totalMatches += modeStat.matchesPlayed || 0;
      });
    }
    
    return {
      success: true,
      data: {
        username: stats?.player?.displayName || username,
        wins: totalWins,
        kills: totalKills,
        matches: totalMatches,
        winRate: totalWins && totalMatches 
          ? ((totalWins / totalMatches) * 100).toFixed(2) 
          : '0.00'
      }
    };
  } catch (error) {
    console.error('Error fetching Fortnite stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
      data: null
    };
  }
}
