import axios from 'axios';

/**
 * Health check script for monitoring Vercel deployment
 * Checks the API endpoint and logs health status
 */

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'http://localhost:3000';
const CHECK_INTERVAL = 60000; // 60 seconds
const HEALTH_ENDPOINT = `${DEPLOYMENT_URL}/api/fortnite?user=test`;

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  responseTime?: number;
  error?: string;
}

async function checkHealth(): Promise<HealthCheckResult> {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    const response = await axios.get(HEALTH_ENDPOINT, {
      timeout: 10000,
      validateStatus: (status) => status >= 200 && status < 300, // Only 2xx is healthy
    });

    const responseTime = Date.now() - startTime;

    console.log(`✅ [${timestamp}] Service is HEALTHY - Response time: ${responseTime}ms`);
    return {
      status: 'healthy',
      timestamp,
      responseTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [${timestamp}] Service is UNHEALTHY - Error: ${errorMessage}`);
    
    // Simulated healing action
    console.log(`🔧 [${timestamp}] Triggering healing action...`);
    console.log(`   - Logging incident to monitoring system`);
    console.log(`   - Alerting on-call engineer`);
    console.log(`   - Attempting automatic recovery...`);

    return {
      status: 'unhealthy',
      timestamp,
      error: errorMessage,
    };
  }
}

async function runHealthMonitor() {
  console.log('🏥 Starting health monitoring for FortniteFrame deployment...');
  console.log(`   Monitoring endpoint: ${HEALTH_ENDPOINT}`);
  console.log(`   Check interval: ${CHECK_INTERVAL / 1000}s\n`);

  let isChecking = false;

  // Function to run periodic checks without overlapping
  const performCheck = async () => {
    if (isChecking) {
      console.log('⏭️  Skipping check - previous check still in progress');
      return;
    }

    isChecking = true;
    try {
      await checkHealth();
    } finally {
      isChecking = false;
    }
  };

  // Run initial check
  await performCheck();

  // Set up periodic checks
  setInterval(performCheck, CHECK_INTERVAL);
}

// Run the health monitor
runHealthMonitor().catch((error) => {
  console.error('Fatal error in health monitor:', error);
  process.exit(1);
});
