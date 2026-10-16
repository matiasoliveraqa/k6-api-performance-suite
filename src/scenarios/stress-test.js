import { getEnvironmentConfig } from '../config/environments.js';
import { STRESS_THRESHOLDS } from '../config/thresholds.js';
import { getAuthToken } from '../utils/auth.js';
import { executeTransactionJourney } from './transaction-flow.js';
import { createSummaryHandler } from '../utils/summary.js';

export const options = {
  // Stress profile: Progressive ramp-up pushing capacity up to 500 VUs
  stages: [
    { duration: '30s', target: 100 }, // Warm-up
    { duration: '1m',  target: 250 }, // Ramp to moderate stress
    { duration: '1m',  target: 500 }, // Ramp to peak stress (500 VUs)
    { duration: '1m',  target: 500 }, // Hold peak stress to test breaking point & saturation
    { duration: '30s', target: 0 },   // Recovery ramp down
  ],
  thresholds: STRESS_THRESHOLDS,
};

export function setup() {
  const config = getEnvironmentConfig();
  console.log(`[Stress Test] Target: ${config.name} (${config.baseUrl})`);
  console.log(`[Stress Test] Target Peak: 500 VUs`);
  console.log(`[Stress Test] Objective: Identify breaking point, saturation, and resource degradation`);

  const token = getAuthToken(config);
  return { token };
}

export default function (data) {
  executeTransactionJourney(data.token);
}

export const handleSummary = createSummaryHandler('stress-test', {
  title: 'System Stress Test - Degradation Boundaries (500 VUs)',
});
