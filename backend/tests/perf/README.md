# Performance tests

## Endpoint under test
* `POST /nodes/get_node_info`

## Targets and success criteria
* **Target load:** 50 requests/second using a constant-arrival-rate executor with 20 pre-allocated VUs (up to 50 max) for 2 minutes.
* **Success criteria:** p95 latency < 500 ms and error rate < 1%.

## Prerequisites
1. Run the backend API locally (default base URL: `http://localhost:8000`).
2. Acquire a valid bearer token and a `node_id` that exists for the authenticated user.

## Run the test
```bash
K6_BASE_URL=http://localhost:8000 \
K6_TOKEN="<jwt>" \
K6_NODE_ID="<node_id>" \
k6 run backend/tests/perf/k6.js
```

### Override load parameters
```bash
K6_BASE_URL=http://localhost:8000 \
K6_TOKEN="<jwt>" \
K6_NODE_ID="<node_id>" \
K6_RATE=100 \
K6_VUS=40 \
K6_MAX_VUS=80 \
K6_DURATION=3m \
k6 run backend/tests/perf/k6.js
```

## Capture results for the report
* Export the summary JSON:
```bash
K6_BASE_URL=http://localhost:8000 \
K6_TOKEN="<jwt>" \
K6_NODE_ID="<node_id>" \
k6 run --summary-export backend/tests/perf/results.json backend/tests/perf/k6.js
```
* Save the console output for the report appendix:
```bash
K6_BASE_URL=http://localhost:8000 \
K6_TOKEN="<jwt>" \
K6_NODE_ID="<node_id>" \
k6 run backend/tests/perf/k6.js | tee backend/tests/perf/results.txt
```
