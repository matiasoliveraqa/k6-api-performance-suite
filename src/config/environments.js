/**
 * Environment configuration loader for k6 and Node.js runners.
 * Supports switching between Mock service, DummyJSON, Httpbin, and custom Staging targets.
 */

const getEnvVar = (key, fallback) => {
  if (typeof __ENV !== 'undefined' && __ENV[key] !== undefined) {
    return __ENV[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  return fallback;
};

const ENVIRONMENTS = {
  // Local or containerized Mock Fintech API
  mock: {
    name: 'Local Mock Fintech Engine',
    baseUrl: getEnvVar('BASE_URL', 'http://127.0.0.1:3333'),
    apiKey: 'mock-dev-key-778899',
    clientId: 'fintech-service',
    clientSecret: 'super-secret-key',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth/token',
      accounts: '/api/v1/accounts',
      accountDetails: (id) => `/api/v1/accounts/${id}`,
      accountBalance: (id) => `/api/v1/accounts/${id}/balance`,
      transfers: '/api/v1/transfers',
      transactions: '/api/v1/transactions',
    },
  },

  // Public High-Throughput REST API (DummyJSON)
  dummyjson: {
    name: 'DummyJSON Public API',
    baseUrl: getEnvVar('BASE_URL', 'https://dummyjson.com'),
    apiKey: 'dummy-demo-token',
    clientId: 'emilys',
    clientSecret: 'emilyspass',
    endpoints: {
      health: '/test',
      auth: '/auth/login',
      accounts: '/users',
      accountDetails: (id) => `/users/${id}`,
      accountBalance: (id) => `/carts/user/${id}`,
      transfers: '/products/add',
      transactions: '/products',
    },
  },

  // Public Httpbin Target (ideal for raw HTTP benchmark validation)
  httpbin: {
    name: 'Httpbin K6 Test Target',
    baseUrl: getEnvVar('BASE_URL', 'https://httpbin.test.k6.io'),
    apiKey: 'httpbin-key',
    clientId: 'test-user',
    clientSecret: 'test-pass',
    endpoints: {
      health: '/status/200',
      auth: '/bearer',
      accounts: '/anything/accounts',
      accountDetails: (id) => `/anything/accounts/${id}`,
      accountBalance: (id) => `/anything/accounts/${id}/balance`,
      transfers: '/post',
      transactions: '/anything/transactions',
    },
  },

  // Dedicated Staging environment
  staging: {
    name: 'Staging Fintech Gateway',
    baseUrl: getEnvVar('BASE_URL', 'https://staging-api.fintech.example.com'),
    apiKey: getEnvVar('API_KEY', 'stg-live-key-xyz99'),
    clientId: getEnvVar('CLIENT_ID', 'fintech-staging-agent'),
    clientSecret: getEnvVar('CLIENT_SECRET', 'stg-secret-pass'),
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth/token',
      accounts: '/api/v1/accounts',
      accountDetails: (id) => `/api/v1/accounts/${id}`,
      accountBalance: (id) => `/api/v1/accounts/${id}/balance`,
      transfers: '/api/v1/transfers',
      transactions: '/api/v1/transactions',
    },
  },
};

export function getEnvironmentConfig() {
  const target = getEnvVar('TARGET_ENV', 'mock').toLowerCase();
  const selectedConfig = ENVIRONMENTS[target] || ENVIRONMENTS.mock;

  // Allow explicit BASE_URL override
  const customBaseUrl = getEnvVar('BASE_URL', null);
  if (customBaseUrl) {
    selectedConfig.baseUrl = customBaseUrl.replace(/\/$/, '');
  }

  return selectedConfig;
}

export default getEnvironmentConfig;
