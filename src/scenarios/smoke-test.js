import { check } from 'k6';
import { getEnvironmentConfig } from '../config/environments.js';
import { SMOKE_THRESHOLDS } from '../config/thresholds.js';
import { getAuthToken } from '../utils/auth.js';
import { executeTransactionJourney } from './transaction-flow.js';
import { createSummaryHandler } from '../utils/summary.js';

export const options = {
  // Minimal load: 5 Virtual Users verifying endpoint health and integrity
  vus: 5,
  duration: '30s',
  thresholds: SMOKE_THRESHOLDS,
};

export function setup() {
  const config = getEnvironmentConfig();
  console.log(`[Smoke Test] Target: ${config.name} (${config.baseUrl})`);
  const token = getAuthToken(config);
  return { token };
}

export default function (data) {
  executeTransactionJourney(data.token);
}

export const handleSummary = createSummaryHandler('smoke-test', {
  title: 'API Smoke Test - Baseline & Health Verification',
});
