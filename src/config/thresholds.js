/**
 * Production SLA & Performance Thresholds
 * 
 * Defines SLA criteria across test profiles:
 * - Smoke: Zero-tolerance for errors, strict latency
 * - Load: Standard SLA (p95 < 200ms, error rate < 1%)
 * - Stress: System degradation discovery (relaxed latency to detect breaking point)
 * - Spike: Sudden surge recovery SLA (quick return to baseline)
 */

export const SMOKE_THRESHOLDS = {
  // HTTP failure rate must be 0% in smoke tests
  http_req_failed: ['rate==0'],
  // 99% of requests must complete below 200ms
  http_req_duration: ['p(95)<200', 'p(99)<300', 'max<1000'],
  // 100% of functional assertions must pass
  checks: ['rate==1.0'],
};

export const LOAD_THRESHOLDS = {
  // Standard Production SLA: Error rate strictly below 1%
  http_req_failed: [
    { threshold: 'rate<0.01', abortOnFail: false, delayAbortEval: '10s' },
  ],
  // Standard Production SLA: 95th percentile under 200ms, 99th percentile under 400ms
  http_req_duration: [
    { threshold: 'p(95)<200', abortOnFail: false },
    { threshold: 'p(99)<400', abortOnFail: false },
    { threshold: 'avg<150', abortOnFail: false },
  ],
  // Minimum 99% check pass rate
  checks: ['rate>0.99'],
  // Custom business metrics thresholds
  'transaction_success_rate': ['rate>0.99'],
  'transaction_duration': ['p(95)<250'],
};

export const STRESS_THRESHOLDS = {
  // Allow slightly higher error boundary during stress ramp-up to locate degradation threshold
  http_req_failed: ['rate<0.05'], // < 5% error allowed at peak stress
  // Latency boundary before total saturation
  http_req_duration: ['p(90)<500', 'p(95)<1000'],
  // Minimum 95% functional check pass rate
  checks: ['rate>0.95'],
};

export const SPIKE_THRESHOLDS = {
  // Error rate under 5% during the instant burst
  http_req_failed: ['rate<0.05'],
  // Spikes temporarily increase latency, 95% must resolve under 800ms
  http_req_duration: ['p(95)<800', 'p(99)<1500'],
  // Minimum 95% check pass rate
  checks: ['rate>0.95'],
};
