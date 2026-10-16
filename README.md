# 🚀 Production-Grade Performance & API Testing Suite

[![k6](https://img.shields.io/badge/Grafana%20k6-v0.54+-7D4698?logo=k6&logoColor=white)](https://k6.io/)
[![Node](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![CI Status](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

An open-source, production-ready Performance and API Automation Testing framework designed for modern cloud-native architectures, high-throughput microservices, and mission-critical financial applications.

Engineered with **Grafana k6** for scalable distributed load benchmarking and **Newman (Postman)** for schema validation, functional integrity, and distributed idempotency testing.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Performance Test Profiles & SLA Matrix](#-performance-test-profiles--sla-matrix)
- [Repository Structure](#-repository-structure)
- [Target API Environments](#-target-api-environments)
- [Quick Start Guide](#-quick-start-guide)
- [Running k6 Performance Tests](#-running-k6-performance-tests)
- [Running Postman / Newman API Tests](#-running-postman--newman-api-tests)
- [Containerized Execution (Docker & Compose)](#-containerized-execution-docker--compose)
- [Interactive HTML Reports & Dashboards](#-interactive-html-reports--dashboards)
- [CI/CD Automation Pipeline](#-cicd-automation-pipeline)
- [Performance Engineering Best Practices](#-performance-engineering-best-practices)
- [License](#-license)

---

## 🏛 Architectural Overview

The suite separates test orchestration, workload generation, data feeds, target environments, and reporting into modular layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Test Runners & Automation                       │
├──────────────────────────────────┬─────────────────────────────────────┤
│      Grafana k6 (Load Engine)     │     Newman / Postman (API QA)      │
│  - Virtual Users (VUs)           │  - Status Code & Latency Asserts    │
│  - Staged Load / Stress / Spike  │  - JSON Schema Compliance           │
│  - Dynamic Data Feeders & Auth   │  - Idempotency & Replay Validation  │
└────────────────┬─────────────────┴──────────────────┬──────────────────┘
                 │                                    │
                 ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Target Infrastructure Layer                      │
├─────────────────────────┬──────────────────────────┬───────────────────┤
│  Local Mock Engine      │  Public REST Sandbox     │  Staging Cluster  │
│  (Stateful, High-QPS,   │  (https://dummyjson.com  │  (Custom Target   │
│   Idempotency Cache)    │   or httpbin.test.k6.io) │   via BASE_URL)   │
└─────────────────────────┴──────────────────────────┴───────────────────┘
                 │                                    │
                 ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Telemetry & Quality Gate Reports                     │
├────────────────────────────┬───────────────────────────────────────────┤
│  Standalone HTML Dashboard │  JSON Metrics Artifacts (CI/CD Quality)   │
│  (Interactive Charts & SLA)│  Colored Terminal Real-time Summary       │
└────────────────────────────┴───────────────────────────────────────────┘
```

---

## 🎯 Performance Test Profiles & SLA Matrix

The suite defines four distinct workload profiles mapped against strict Service Level Agreements (SLAs):

| Test Profile | Script Path | VUs / Target | Duration | Primary Objective | SLA Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Smoke Test** | `tests/smoke-test.js` | 5 VUs | 30s | Sanity check, connectivity, health check, baseline verification | **p95 < 200ms**, `error_rate == 0%`, `checks == 100%` |
| **Load Test** | `tests/load-test.js` | 100–200 VUs | 2 min | Simulate expected peak production traffic under steady-state load | **p95 < 200ms**, `p99 < 400ms`, **error_rate < 1.0%** |
| **Stress Test** | `tests/stress-test.js` | Ramp to 500 VUs | 4 min | Determine system degradation boundaries, memory leaks, and breaking points | **p90 < 500ms**, `error_rate < 5%` at peak capacity |
| **Spike Test** | `tests/spike-test.js` | 10 ➔ 400 VUs | 1.5 min | Sudden traffic burst; test circuit breakers, thread pool starvation & recovery | `error_rate < 5%`, fast recovery back to baseline |

---

## 📂 Repository Structure

```
k6-api-performance-suite/
├── .github/
│   └── workflows/
│       └── performance.yml        # CI/CD Pipeline running Smoke/Load & Newman
├── collections/
│   └── fintech-api.collection.json# Postman 2.1 collection with idempotency checks
├── environments/
│   ├── local.json                 # Postman local mock environment variables
│   └── staging.json               # Postman staging environment template
├── src/
│   ├── config/
│   │   ├── environments.js        # Multi-target configuration (Mock, DummyJSON, Httpbin)
│   │   └── thresholds.js          # Production SLA thresholds & performance budgets
│   ├── mock/
│   │   └── server.js              # High-throughput mock Fintech REST API
│   ├── scenarios/
│   │   ├── smoke-test.js          # Smoke scenario definition
│   │   ├── load-test.js           # Load scenario definition
│   │   ├── stress-test.js         # Stress scenario definition
│   │   ├── spike-test.js          # Spike scenario definition
│   │   └── transaction-flow.js    # Reusable end-to-end user transaction workflow
│   └── utils/
│       ├── auth.js                # Token handshake and authentication helper
│       ├── data-feeder.js         # Realistic synthetic payload and account feeder
│       ├── headers.js             # UUID, tracing correlation IDs, idempotency headers
│       ├── k6-reporter.js         # Bundled standalone HTML reporter (works 100% offline)
│       ├── metrics.js             # Custom k6 Trends, Rates, and Counters
│       ├── summary.js             # Unified report dispatcher (HTML, JSON, stdout)
│       └── text-summary.js        # Formatted console output generator
├── tests/                         # Direct execution entrypoints
│   ├── smoke-test.js
│   ├── load-test.js
│   ├── stress-test.js
│   └── spike-test.js
├── reports/                       # Generated HTML and JSON reports (.gitkeep)
├── Dockerfile                     # Multi-tool container (Node + k6 + Newman)
├── docker-compose.yml             # Orchestration for mock server and test runners
├── package.json                   # NPM script definitions and dependencies
└── README.md                      # Complete documentation
```

---

## 🌐 Target API Environments

Tests can execute against three target setups without changing test code:

1. **Built-in Mock Fintech Engine (`TARGET_ENV=mock`)**:
   - Ultra-fast local Express server supporting OAuth tokens, account lookups, transactions, and **true ACID idempotent transfers** with cache hit detection (`X-Cache-Lookup: HIT`).
2. **DummyJSON Public API (`TARGET_ENV=dummyjson`)**:
   - Tests against `https://dummyjson.com` using real auth, users, carts, and product endpoints.
3. **Httpbin Benchmark API (`TARGET_ENV=httpbin`)**:
   - Tests against `https://httpbin.test.k6.io` for raw network and gateway overhead analysis.
4. **Custom Base URL (`BASE_URL=https://your-api.com`)**:
   - Directly override the target URL for staging or pre-production environments.

---

## ⚡ Quick Start Guide

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **k6 CLI**: Installed locally ([k6 installation docs](https://k6.io/docs/get-started/installation/))
  ```bash
  # Linux (Debian/Ubuntu)
  sudo gpg -k
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update && sudo apt-get install k6

  # Arch / CachyOS Linux
  sudo pacman -S k6

  # macOS
  brew install k6
  ```

### 1. Install Dependencies

```bash
git clone https://github.com/your-org/k6-api-performance-suite.git
cd k6-api-performance-suite
npm install
```

### 2. Start the High-Throughput Mock API Server

In a separate terminal or background job:

```bash
npm run start:mock
```
Output:
```
[fintech-mock-api] Server running on http://0.0.0.0:3333
[fintech-mock-api] Healthcheck available at http://0.0.0.0:3333/health
```

---

## 📊 Running k6 Performance Tests

### Smoke Test (Sanity & Baseline)
```bash
npm run test:smoke
```

### Production Load Test (100–200 VUs, 2 Minutes)
```bash
npm run test:load
```

### Stress Test (Ramping up to 500 VUs)
```bash
npm run test:stress
```

### Spike Test (Instant Traffic Surge)
```bash
npm run test:spike
```

### Targeting External Public Sandboxes
Pass `TARGET_ENV` to test against public test APIs:

```bash
# Run smoke test against DummyJSON
k6 run tests/smoke-test.js -e TARGET_ENV=dummyjson

# Run load test against custom staging cluster
k6 run tests/load-test.js -e BASE_URL=https://staging.internal.fintech.io
```

---

## 🧪 Running Postman / Newman API Tests

The suite includes an automated Postman collection verifying:
- Authentication & JWT token extraction
- Account balance retrieval
- **Idempotency checks**: Verifying duplicate requests with the same `Idempotency-Key` yield identical responses and `X-Cache-Lookup: HIT` without double debit.
- Negative tests: Missing idempotency key rejection (`400 Bad Request`).
- Schema validation via JSON Schema.

```bash
# Run against local mock API with console summary
npm run test:api

# Run against staging environment
npm run test:api:staging

# Generate detailed interactive HTML report via newman-reporter-htmlextra
npm run test:api:html
```

---

## 🐳 Containerized Execution (Docker & Compose)

Run tests in completely isolated, reproducible containers without needing local k6 or Newman installations.

### Using Docker Compose

```bash
# 1. Run Newman integration tests in container
npm run docker:newman

# 2. Run k6 Smoke Test in container
npm run docker:smoke

# 3. Run k6 Production Load Test in container
npm run docker:load

# 4. Run k6 Stress Test in container
npm run docker:stress

# 5. Run k6 Spike Test in container
npm run docker:spike
```

All test reports generated inside containers are mapped directly to your local `./reports/` directory.

---

## 📈 Interactive HTML Reports & Dashboards

Every execution produces rich, self-contained HTML reports in `./reports/`:

- `reports/smoke-test.html`
- `reports/load-test.html`
- `reports/stress-test.html`
- `reports/spike-test.html`
- `reports/newman-report.html`

### Report Features
- **Visual SLA Cards**: Real-time pass/fail indicators against defined budgets.
- **Percentile Distributions**: p90, p95, p99 latencies for each endpoint group.
- **Custom Telemetry**:
  - `transaction_duration`: Exact round-trip transaction processing time.
  - `transaction_success_rate`: Percentage of financial transfers committed.
  - `idempotency_hit_rate`: Rate of duplicate requests successfully deduplicated.

To view reports:
```bash
# Open in your browser (Linux)
xdg-open reports/latest-summary.html

# macOS
open reports/latest-summary.html
```

---

## 🔄 CI/CD Automation Pipeline

The repository includes a ready-to-use GitHub Actions workflow (`.github/workflows/performance.yml`):

- **Triggers**: On pull request, push to `main`, or manual trigger (`workflow_dispatch`).
- **Steps**:
  1. Spawns mock API background service.
  2. Runs Newman integration & idempotency tests.
  3. Executes k6 smoke test quality gate.
  4. Runs production load test SLA verification.
  5. Publishes HTML performance reports as workflow artifacts (retained for 30 days).
  6. Renders summary markdown directly into GitHub Job Step Summary.

---

## 💡 Performance Engineering Best Practices

1. **Always Ramp-Up**: Never immediately bombard a service with maximum VUs unless deliberately executing a Spike test. Ramping allows JIT compilation, connection pooling, and autoscaling to warm up.
2. **Model Realistic Think Times**: Real users do not fire back-to-back requests in 0ms. Use `sleep(random)` pacing in `src/scenarios/transaction-flow.js` to simulate human/client delays.
3. **Validate Idempotency Under Load**: Under high concurrency, race conditions can cause duplicate debits if idempotency locks are not atomic. The suite validates that replayed transactions maintain identical status and remaining balances.
4. **Monitor Client Resource Saturation**: Ensure the machine generating the load is not CPU-throttled or starved of file descriptors (`ulimit -n 65535`).

---

## 📄 License

Distributed under the Apache-2.0 License. See `LICENSE` for details.
