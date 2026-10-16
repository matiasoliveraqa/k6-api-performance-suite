# ==============================================================================
# Production-grade Container Image for k6 & Newman Performance Testing Suite
# ==============================================================================
FROM node:20-alpine AS base

# Install curl, bash, tar, ca-certificates for binary downloads
RUN apk add --no-cache curl bash ca-certificates

# Install official Grafana k6 binary
ENV K6_VERSION="v0.54.0"
RUN curl -sSL "https://github.com/grafana/k6/releases/download/${K6_VERSION}/k6-${K6_VERSION}-linux-amd64.tar.gz" \
    | tar -xz -C /tmp \
    && mv "/tmp/k6-${K6_VERSION}-linux-amd64/k6" /usr/local/bin/k6 \
    && rm -rf /tmp/k6* \
    && k6 version

WORKDIR /app

# Copy dependency manifests and install dependencies
COPY package*.json ./
RUN npm ci --omit=optional

# Copy application source code, tests, collections, and environments
COPY . .

# Ensure output reports directory exists with proper permissions
RUN mkdir -p /app/reports && chmod -R 777 /app/reports

EXPOSE 3333

# Default entrypoint runs smoke test, customizable via CMD or docker-compose
ENTRYPOINT ["k6"]
CMD ["run", "tests/smoke-test.js"]
