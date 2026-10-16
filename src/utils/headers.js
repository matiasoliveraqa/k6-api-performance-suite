/**
 * HTTP Headers utility for k6 performance testing.
 * Provides standard tracing, authorization, and idempotency headers.
 */

// Simple lightweight pseudo-UUID generator compatible with k6 ES6 runtime
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Builds HTTP headers dictionary for API requests.
 * @param {Object} options
 * @param {string} [options.token] - Bearer authorization token
 * @param {string} [options.apiKey] - Optional x-api-key header
 * @param {string} [options.idempotencyKey] - Custom or auto-generated idempotency key
 * @param {string} [options.correlationId] - Distributed tracing correlation ID
 * @param {string} [options.contentType] - Content-Type header (defaults to application/json)
 * @returns {Object} Headers object
 */
export function buildHeaders(options = {}) {
  const {
    token,
    apiKey,
    idempotencyKey,
    correlationId = generateUUID(),
    contentType = 'application/json',
    customHeaders = {},
  } = options;

  const headers = {
    'Content-Type': contentType,
    'Accept': 'application/json',
    'X-Request-Id': correlationId,
    'X-Correlation-Id': correlationId,
    'User-Agent': 'k6-performance-suite/1.0.0 (Grafana k6)',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  return headers;
}

export default buildHeaders;
