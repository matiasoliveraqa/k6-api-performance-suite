import { getEnvironmentConfig } from '../config/environments.js';
import { LOAD_THRESHOLDS } from '../config/thresholds.js';
import { getAuthToken } from '../utils/auth.js';
import { executeTransactionJourney } from './transaction-flow.js';
import { createSummaryHandler } from '../utils/summary.js';

export const options = {
  // Standard production load profile: 100-200 VUs over 2 minutes
  stages: [
    { duration: '30s', target: 120 }, // Warm-up ramp to baseline load
    { duration: '60s', target: 180 }, // Sustained standard peak production load (100-200 VUs)
    { duration: '30s', target: 0 },   // Graceful cooldown ramp down
  ],
  thresholds: LOAD_THRESHOLDS,
};

export function setup() {
  const config = getEnvironmentConfig();
  console.log(`[Load Test] Target: ${config.name} (${config.baseUrl})`);
  console.log(`[Load Test] Profile: 100-200 VUs, Duration: 2 minutes`);
  console.log(`[Load Test] SLA: p95 < 200ms, Error Rate < 1%`);

  const token = getAuthToken(config);
  return { token };
}

export default function (data) {
  executeTransactionJourney(data.token);
}

export const handleSummary = createSummaryHandler('load-test', {
  title: 'Production Load Test - SLA Verification (100-200 VUs)',
});
