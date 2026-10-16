# k6 API Performance & Load Testing Suite

[![k6](https://img.shields.io/badge/k6-v0.54+-7D64FF.svg?logo=k6&logoColor=white)](https://k6.io/)
[![Newman](https://img.shields.io/badge/newman-v6.2+-FF6C37.svg?logo=postman&logoColor=white)](https://learning.postman.com/docs/collections/using-newman-cli/command-line-integration-with-newman/)
[![CI Status](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF.svg?logo=github-actions&logoColor=white)](.github/workflows/performance.yml)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg?logo=docker&logoColor=white)](docker-compose.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

A production-grade, open-source performance testing and API automation framework built with **Grafana k6** and **Newman (Postman)**. Designed to validate throughput, high concurrency, SLA latency thresholds, and financial transaction idempotency.

---

## 📊 Performance Testing Profiles

| Profile | Command | Target VUs | Duration | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Smoke Test** | `npm run test:smoke` | 3 VUs | 15s | Health check & pipeline sanity validation |
| **Load Test** | `npm run test:load` | 50 VUs | 2m | Standard production traffic & SLA baseline |
| **Stress Test** | `npm run test:stress` | Up to 300 VUs | 3m | Identify concurrency limits & breaking points |
| **Spike Test** | `npm run test:spike` | Surge to 250 VUs | 1m | Verify autoscaling & sudden traffic spikes |
| **Postman API** | `npm run test:api` | Single Runner | N/A | Automated functional assertions & idempotency |

---

## 🏛️ SLA Thresholds & Non-Functional Requirements (NFRs)

- **p95 Latency**: `< 250ms` under normal load
- **p99 Latency**: `< 400ms` under peak load
- **Error Rate (`http_req_failed`)**: `< 1.0%`
- **Check Pass Rate**: `> 99.0%`
- **Idempotency Guarantee**: 100% duplicate protection on payment transfer operations (`X-Idempotent-Replay: true`)

---

## 🚀 Quick Start

### 1. Local Execution
```bash
git clone https://github.com/kraperped/k6-api-performance-suite.git
cd k6-api-performance-suite
npm install

# Run Smoke Test (generates HTML report)
npm run test:smoke

# Run Full Load Benchmark
npm run test:load
```

### 2. View HTML Summary Report
Once a test completes, open the interactive HTML report in your browser:
```bash
xdg-open reports/k6-summary.html
```

### 3. Containerized Run (Docker Compose)
Run with zero local setup:
```bash
docker compose run --rm k6-smoke
```

---

## 🔄 CI/CD Automation (GitHub Actions)

The included `.github/workflows/performance.yml` workflow:
1. Provisions dependencies and spins up the mock service.
2. Runs Newman API tests to verify endpoints and idempotency.
3. Executes k6 load benchmarks against defined latency SLAs.
4. Publishes interactive HTML performance reports as downloadable CI artifacts.

---

## 👤 Author
**Matías Olivera** — *Senior QA Engineer & SDET*  
- LinkedIn: [linkedin.com/in/matiolivera](https://www.linkedin.com/in/matiolivera/)  
- Portfolio: [kraperped.github.io](https://kraperped.github.io/)  
- Email: [matiluzardo3@gmail.com](mailto:matiluzardo3@gmail.com)
