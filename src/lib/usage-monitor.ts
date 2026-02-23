/**
 * Usage Monitor - Track API usage and alert when approaching limits
 * 
 * Stores usage stats in memory (resets on cold start)
 * For production, consider using Redis or database
 */

interface UsageStats {
  requests: number;
  errors: number;
  lastReset: number;
  byEndpoint: Record<string, number>;
}

// In-memory usage tracking (resets on cold start)
let usageStats: UsageStats = {
  requests: 0,
  errors: 0,
  lastReset: Date.now(),
  byEndpoint: {}
};

// Alert thresholds
const THRESHOLDS = {
  REQUESTS_PER_HOUR: 500,     // Alert if >500 requests/hour
  ERROR_RATE_PERCENT: 10,     // Alert if >10% error rate
  GEMINI_RATE_LIMIT: 1000,    // Gemini Pro limit per minute
};

// Reset stats every hour
function maybeResetStats() {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  if (usageStats.lastReset < hourAgo) {
    usageStats = {
      requests: 0,
      errors: 0,
      lastReset: Date.now(),
      byEndpoint: {}
    };
  }
}

// Track a request
export function trackRequest(endpoint: string, isError: boolean = false) {
  maybeResetStats();
  usageStats.requests++;
  usageStats.byEndpoint[endpoint] = (usageStats.byEndpoint[endpoint] || 0) + 1;
  if (isError) {
    usageStats.errors++;
  }
}

// Get current stats
export function getUsageStats(): UsageStats & { alerts: string[] } {
  maybeResetStats();
  
  const alerts: string[] = [];
  
  // Check thresholds
  if (usageStats.requests > THRESHOLDS.REQUESTS_PER_HOUR) {
    alerts.push(`⚠️ High traffic: ${usageStats.requests} requests in the last hour`);
  }
  
  const errorRate = usageStats.requests > 0 
    ? (usageStats.errors / usageStats.requests) * 100 
    : 0;
  if (errorRate > THRESHOLDS.ERROR_RATE_PERCENT) {
    alerts.push(`🔴 High error rate: ${errorRate.toFixed(1)}%`);
  }
  
  return {
    ...usageStats,
    alerts
  };
}

// Check if we should warn about rate limits
export function checkRateLimitWarning(): { warning: boolean; message?: string } {
  maybeResetStats();
  
  // If we're getting close to Gemini limits
  const visualizeRequests = usageStats.byEndpoint['/api/visualize'] || 0;
  const scanRequests = usageStats.byEndpoint['/api/scan-receipt'] || 0;
  const totalAiRequests = visualizeRequests + scanRequests;
  
  if (totalAiRequests > THRESHOLDS.GEMINI_RATE_LIMIT * 0.8) {
    return {
      warning: true,
      message: `Approaching Gemini rate limit: ${totalAiRequests}/${THRESHOLDS.GEMINI_RATE_LIMIT} requests`
    };
  }
  
  return { warning: false };
}
