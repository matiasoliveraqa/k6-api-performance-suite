import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3333;
const HOST = process.env.HOST || '0.0.0.0';

// Global middleware
app.use(cors());
app.use(express.json());

// In-memory data store for realistic stateful operations
const state = {
  accounts: new Map([
    ['acc_prod_001', { id: 'acc_prod_001', owner: 'Alice Core', balance: 50000.0, currency: 'USD', status: 'ACTIVE', tier: 'ENTERPRISE' }],
    ['acc_prod_002', { id: 'acc_prod_002', owner: 'Bob Retail', balance: 12500.5, currency: 'USD', status: 'ACTIVE', tier: 'PREMIUM' }],
    ['acc_prod_003', { id: 'acc_prod_003', owner: 'Charlie Corp', balance: 1500000.0, currency: 'USD', status: 'ACTIVE', tier: 'INSTITUTIONAL' }],
    ['acc_demo_001', { id: 'acc_demo_001', owner: 'Demo Account', balance: 10000.0, currency: 'USD', status: 'ACTIVE', tier: 'STANDARD' }],
  ]),
  transactions: [],
  idempotencyStore: new Map(), // key -> { responseStatus, responseHeaders, responseBody, timestamp }
  tokens: new Set(['fintech_bearer_token_super_secret_jwt']),
};

// Configurable latency & fault injection for testing resilience
const ARTIFICIAL_LATENCY_MS = parseInt(process.env.MOCK_LATENCY_MS || '0', 10);

app.use((req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', reqId);
  res.setHeader('X-Service-Name', 'fintech-mock-engine');

  if (ARTIFICIAL_LATENCY_MS > 0) {
    setTimeout(next, ARTIFICIAL_LATENCY_MS);
  } else {
    next();
  }
});

// 1. Health Checks
app.get(['/health', '/api/v1/health', '/test'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'fintech-core-api',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 2. Authentication
app.post(['/api/v1/auth/token', '/auth/login'], (req, res) => {
  const { clientId, clientSecret, username, password } = req.body || {};

  // Support both OAuth client credentials and username/password
  const isValidClient = (clientId === 'fintech-service' && clientSecret === 'super-secret-key') ||
                        (username === 'emilys' && (password === 'emilyspass' || password === 'emilyspassword')) ||
                        (username === 'demo_user' && password === 'secret123') ||
                        (!clientId && !username); // permissive for open load testing defaults

  if (!isValidClient && clientId) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid credentials provided',
    });
  }

  const token = `eyJh...${crypto.randomBytes(24).toString('hex')}...jwt`;
  state.tokens.add(token);

  res.status(200).json({
    accessToken: token,
    tokenType: 'Bearer',
    expiresIn: 3600,
    scope: 'transfers:write accounts:read transactions:read',
    user: {
      id: 1,
      username: username || clientId || 'system-agent',
      email: 'ops@fintech-enterprise.io',
    },
  });
});

// Middleware for token authentication check (optional bypass for open load-tests)
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or malformed Authorization header. Expected Bearer <token>',
    });
  }
  next();
}

// 3. Accounts
app.get('/api/v1/accounts', (req, res) => {
  const accountsList = Array.from(state.accounts.values());
  res.status(200).json({
    data: accountsList,
    total: accountsList.length,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/accounts/:id', (req, res) => {
  const account = state.accounts.get(req.params.id);
  if (!account) {
    return res.status(404).json({
      error: 'ACCOUNT_NOT_FOUND',
      message: `Account with ID '${req.params.id}' was not found`,
    });
  }
  res.status(200).json(account);
});

app.get('/api/v1/accounts/:id/balance', (req, res) => {
  const account = state.accounts.get(req.params.id);
  if (!account) {
    return res.status(404).json({
      error: 'ACCOUNT_NOT_FOUND',
      message: `Account with ID '${req.params.id}' was not found`,
    });
  }
  res.status(200).json({
    accountId: account.id,
    balance: account.balance,
    currency: account.currency,
    lastUpdated: new Date().toISOString(),
  });
});

// 4. Transfers with Strict Idempotency Verification
app.post('/api/v1/transfers', (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return res.status(400).json({
      error: 'MISSING_IDEMPOTENCY_KEY',
      message: 'Header "Idempotency-Key" is required for financial transfer operations.',
    });
  }

  // Idempotency cache hit check
  if (state.idempotencyStore.has(idempotencyKey)) {
    const cached = state.idempotencyStore.get(idempotencyKey);
    res.setHeader('X-Cache-Lookup', 'HIT');
    res.setHeader('X-Idempotent-Replay', 'true');
    return res.status(cached.responseStatus).json(cached.responseBody);
  }

  const { sourceAccountId, destinationAccountId, amount, currency, reference } = req.body || {};

  if (!sourceAccountId || !destinationAccountId || !amount) {
    return res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'sourceAccountId, destinationAccountId, and positive amount are required.',
    });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(422).json({
      error: 'INVALID_AMOUNT',
      message: 'Amount must be a positive number.',
    });
  }

  const source = state.accounts.get(sourceAccountId);
  const dest = state.accounts.get(destinationAccountId);

  if (!source) {
    return res.status(404).json({
      error: 'SOURCE_ACCOUNT_NOT_FOUND',
      message: `Source account '${sourceAccountId}' does not exist.`,
    });
  }

  if (source.balance < numericAmount) {
    return res.status(409).json({
      error: 'INSUFFICIENT_FUNDS',
      message: `Account '${sourceAccountId}' has insufficient funds (${source.balance} ${source.currency}) for transfer of ${numericAmount}.`,
    });
  }

  // Execute ledger debit & credit
  source.balance -= numericAmount;
  if (dest) {
    dest.balance += numericAmount;
  }

  const transactionId = `txn_${crypto.randomBytes(12).toString('hex')}`;
  const responsePayload = {
    transactionId,
    idempotencyKey,
    sourceAccountId,
    destinationAccountId,
    amount: numericAmount,
    currency: currency || source.currency,
    reference: reference || 'Peer transfer',
    status: 'COMPLETED',
    remainingBalance: source.balance,
    createdAt: new Date().toISOString(),
  };

  // Cache response for idempotent replay
  state.idempotencyStore.set(idempotencyKey, {
    responseStatus: 201,
    responseBody: responsePayload,
    timestamp: Date.now(),
  });

  state.transactions.unshift(responsePayload);
  if (state.transactions.length > 5000) {
    state.transactions.pop();
  }

  res.setHeader('X-Cache-Lookup', 'MISS');
  res.setHeader('X-Idempotent-Replay', 'false');
  res.status(201).json(responsePayload);
});

// 5. Transactions
app.get('/api/v1/transactions', (req, res) => {
  const { accountId, limit = 50, offset = 0 } = req.query;
  let txns = state.transactions;

  if (accountId) {
    txns = txns.filter(t => t.sourceAccountId === accountId || t.destinationAccountId === accountId);
  }

  const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
  const parsedOffset = parseInt(offset, 10) || 0;
  const paginated = txns.slice(parsedOffset, parsedOffset + parsedLimit);

  res.status(200).json({
    data: paginated,
    total: txns.length,
    limit: parsedLimit,
    offset: parsedOffset,
  });
});

app.get('/api/v1/transactions/:id', (req, res) => {
  const txn = state.transactions.find(t => t.transactionId === req.params.id);
  if (!txn) {
    return res.status(404).json({
      error: 'TRANSACTION_NOT_FOUND',
      message: `Transaction with ID '${req.params.id}' was not found.`,
    });
  }
  res.status(200).json(txn);
});

// Reset endpoint for testing state cleanup
app.post('/api/v1/admin/reset', (req, res) => {
  state.idempotencyStore.clear();
  state.transactions = [];
  state.accounts.get('acc_prod_001').balance = 50000.0;
  state.accounts.get('acc_prod_002').balance = 12500.5;
  state.accounts.get('acc_prod_003').balance = 1500000.0;
  state.accounts.get('acc_demo_001').balance = 10000.0;
  res.status(200).json({ status: 'RESET_OK' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    path: req.path,
    message: 'Endpoint does not exist',
  });
});

// Start listener if invoked directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  app.listen(PORT, HOST, () => {
    console.log(`[fintech-mock-api] Server running on http://${HOST}:${PORT}`);
    console.log(`[fintech-mock-api] Healthcheck available at http://${HOST}:${PORT}/health`);
  });
}

export default app;
