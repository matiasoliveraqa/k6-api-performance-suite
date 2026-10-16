import { Trend, Rate, Counter } from 'k6/metrics';

/**
 * Custom telemetry and business metrics for tracking SLA compliance
 */
export const transactionDuration = new Trend('transaction_duration', true);
export const transactionSuccessRate = new Rate('transaction_success_rate');
export const idempotencyHitRate = new Rate('idempotency_hit_rate');
export const totalTransactionsCounter = new Counter('total_transactions_processed');
export const failedRequestsCounter = new Counter('custom_failed_requests');

/**
 * Helper to record transaction results in custom metrics
 */
export function recordTransactionMetrics(durationMs, isSuccess, isIdempotentHit = false) {
  transactionDuration.add(durationMs);
  transactionSuccessRate.add(isSuccess ? 1 : 0);
  totalTransactionsCounter.add(1);

  if (isIdempotentHit) {
    idempotencyHitRate.add(1);
  } else {
    idempotencyHitRate.add(0);
  }

  if (!isSuccess) {
    failedRequestsCounter.add(1);
  }
}

export default {
  transactionDuration,
  transactionSuccessRate,
  idempotencyHitRate,
  totalTransactionsCounter,
  failedRequestsCounter,
  recordTransactionMetrics,
};
