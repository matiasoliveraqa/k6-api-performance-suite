/**
 * Dynamic test data generator for high-throughput API benchmarking.
 */

const ACCOUNT_POOL = [
  'acc_prod_001',
  'acc_prod_002',
  'acc_prod_003',
  'acc_demo_001',
];

const CURRENCIES = ['USD', 'EUR', 'GBP'];

const REFERENCES = [
  'Invoice settlement',
  'Monthly retainer fee',
  'P2P transfer',
  'Supplier payout',
  'Subscription renewal',
  'Escrow disbursement',
];

/**
 * Returns a random element from an array.
 */
export function sample(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Returns a random float formatted to 2 decimals between min and max.
 */
export function randomAmount(min = 1.0, max = 250.0) {
  const val = Math.random() * (max - min) + min;
  return Math.round(val * 100) / 100;
}

/**
 * Returns a pair of distinct source and destination accounts.
 */
export function getRandomAccountPair() {
  const sourceIndex = Math.floor(Math.random() * ACCOUNT_POOL.length);
  let destIndex = Math.floor(Math.random() * (ACCOUNT_POOL.length - 1));
  if (destIndex >= sourceIndex) destIndex += 1;

  return {
    sourceAccountId: ACCOUNT_POOL[sourceIndex],
    destinationAccountId: ACCOUNT_POOL[destIndex],
  };
}

/**
 * Generates transfer transaction payload.
 */
export function generateTransferPayload(overrides = {}) {
  const { sourceAccountId, destinationAccountId } = getRandomAccountPair();

  return {
    sourceAccountId,
    destinationAccountId,
    amount: randomAmount(5.0, 150.0),
    currency: sample(CURRENCIES),
    reference: sample(REFERENCES),
    ...overrides,
  };
}

export default {
  sample,
  randomAmount,
  getRandomAccountPair,
  generateTransferPayload,
  ACCOUNT_POOL,
};
