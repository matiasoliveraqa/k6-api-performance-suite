import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from '../src/utils/k6-reporter.js';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '20s', target: 250 }, // Instant spike!
    { duration: '30s', target: 250 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://dummyjson.com';

export default function () {
  const res = http.get(`${BASE_URL}/products/1`);
  check(res, {
    'Product fetch status 200 during spike': (r) => r.status === 200,
  });
  sleep(0.3);
}

export function handleSummary(data) {
  return {
    'reports/k6-spike-summary.html': htmlReport(data, { title: 'k6 Spike Test Report' }),
  };
}
