import { getEnvironmentConfig } from '../config/environments.js';
import { SPIKE_THRESHOLDS } from '../config/thresholds.js';
import { getAuthToken } from '../utils/auth.js';
import { executeTransactionJourney } from './transaction-flow.js';
import { createSummaryHandler } from '../utils/summary.js';

export const options = {
  // Spike profile: Sudden burst in traffic, followed by abrupt drop
  stages: [
    { duration: '10s', target: 10 },  // Normal baseline activity
    { duration: '10s', target: 400 }, // Sudden massive surge (spike)
    { duration: '30s', target: 400 }, // Sustain spike to assess queueing and thread pool exhaustion
    { duration: '10s', target: 10 },  // Sudden collapse back to baseline
    { duration: '20s', target: 10 },  // Recovery monitoring period
  ],
  thresholds: SPIKE_THRESHOLDS,
};

export function setup() {
  const config = getEnvironmentConfig();
  console.log(`[Spike Test] Target: ${config.name} (${config.baseUrl})`);
  console.log(`[Spike Test] Profile: Baseline 10 VUs -> 400 VUs sudden burst -> Recovery`);
  console.log(`[Spike Test] Objective: Assess circuit breakers, queueing resilience, and auto-recovery`);

  const token = getAuthToken(config);
  return { token };
}

export default function (data) {
  executeTransactionJourney(data.token);
}

export const handleSummary = createSummaryHandler('spike-test', {
  title: 'API Spike Test - Sudden Traffic Surge & Recovery',
});
