FROM grafana/k6:0.54.0

WORKDIR /app
COPY . /app

ENTRYPOINT ["k6"]
CMD ["run", "tests/smoke-test.js"]
