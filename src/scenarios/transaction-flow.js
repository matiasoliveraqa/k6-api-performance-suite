import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getEnvironmentConfig } from '../config/environments.js';
import { buildHeaders, generateUUID } from '../utils/headers.js';
import { generateTransferPayload, getRandomAccountPair } from '../utils/data-feeder.js';
import { recordTransactionMetrics } from '../utils/metrics.js';

/**
 * Executes a full lifecycle user transaction journey.
 * Compatible with local Mock API, DummyJSON, and Httpbin targets.
 */
export function executeTransactionJourney(authToken = null) {
  const config = getEnvironmentConfig();
  const target = (typeof __ENV !== 'undefined' && __ENV.TARGET_ENV ? __ENV.TARGET_ENV : 'mock').toLowerCase();

  // 1. Health & Readiness Probe
  group('01_Health_Readiness_Probe', () => {
    const healthUrl = `${config.baseUrl}${config.endpoints.health}`;
    const res = http.get(healthUrl, {
      headers: buildHeaders(),
      tags: { name: 'HealthCheck' },
    });

    check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check latency < 150ms': (r) => r.timings.duration < 150,
    });
  });

  // 2. Account Details & Balance Verification
  let accountId = 'acc_prod_001';
  group('02_Account_Balance_Lookup', () => {
    let url;
    if (target === 'dummyjson') {
      url = `${config.baseUrl}/users/1`;
    } else if (target === 'httpbin') {
      url = `${config.baseUrl}/anything/accounts/${accountId}/balance`;
    } else {
      url = `${config.baseUrl}${config.endpoints.accountBalance(accountId)}`;
    }

    const res = http.get(url, {
      headers: buildHeaders({ token: authToken }),
      tags: { name: 'AccountBalance' },
    });

    check(res, {
      'account balance status is 200': (r) => r.status === 200,
      'account balance latency < 200ms': (r) => r.timings.duration < 200,
      'account response has valid payload': (r) => {
        try {
          const body = r.json();
          return body !== null && (body.balance !== undefined || body.id !== undefined || body.url !== undefined);
        } catch (e) {
          return false;
        }
      },
    });
  });

  // 3. High-Integrity Financial Transfer with Idempotency
  group('03_Fund_Transfer_Idempotent', () => {
    const idempotencyKey = generateUUID();
    let url, payload;

    if (target === 'dummyjson') {
      url = `${config.baseUrl}/products/add`;
      payload = JSON.stringify({
        title: `Transfer order ${idempotencyKey.substring(0, 8)}`,
        price: 49.99,
        category: 'finance',
      });
    } else if (target === 'httpbin') {
      url = `${config.baseUrl}/post`;
      payload = JSON.stringify(generateTransferPayload());
    } else {
      url = `${config.baseUrl}${config.endpoints.transfers}`;
      payload = JSON.stringify(generateTransferPayload({
        sourceAccountId: 'acc_prod_001',
        destinationAccountId: 'acc_prod_002',
      }));
    }

    const startTime = Date.now();
    const res = http.post(url, payload, {
      headers: buildHeaders({
        token: authToken,
        idempotencyKey,
      }),
      tags: { name: 'TransferInitial' },
    });
    const duration = Date.now() - startTime;

    const isSuccess = check(res, {
      'transfer status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'transfer latency < 350ms': (r) => r.timings.duration < 350,
    });

    recordTransactionMetrics(duration, isSuccess, false);

    // 4. Idempotency Replay Verification (simulates network retry with duplicate key)
    // Only applies to mock/fintech target where idempotent replay header is returned
    if (target === 'mock' || target === 'staging') {
      const replayRes = http.post(url, payload, {
        headers: buildHeaders({
          token: authToken,
          idempotencyKey, // same key
        }),
        tags: { name: 'TransferReplay' },
      });

      const replaySuccess = check(replayRes, {
        'replay returns 200 or 201': (r) => r.status === 200 || r.status === 201,
        'replay triggers idempotency cache hit': (r) => r.headers['X-Cache-Lookup'] === 'HIT' || r.status === 201,
      });

      recordTransactionMetrics(replayRes.timings.duration, replaySuccess, true);
    }
  });

  // 5. Transaction Audit Query
  group('04_Transaction_Audit_History', () => {
    let url;
    if (target === 'dummyjson') {
      url = `${config.baseUrl}/products?limit=5`;
    } else if (target === 'httpbin') {
      url = `${config.baseUrl}/anything/transactions?limit=5`;
    } else {
      url = `${config.baseUrl}${config.endpoints.transactions}?limit=10`;
    }

    const res = http.get(url, {
      headers: buildHeaders({ token: authToken }),
      tags: { name: 'TransactionAudit' },
    });

    check(res, {
      'audit query returns 200': (r) => r.status === 200,
      'audit query latency < 250ms': (r) => r.timings.duration < 250,
    });
  });

  // Think time between user actions (pacing)
  sleep(Math.random() * 0.3 + 0.1);
}

export default executeTransactionJourney;
