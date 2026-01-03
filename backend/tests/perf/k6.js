import http from "k6/http";
import { check } from "k6";

const baseUrl = __ENV.K6_BASE_URL || "http://localhost:8000";
const rawToken = __ENV.K6_TOKEN;
const nodeId = __ENV.K6_NODE_ID;

if (!rawToken) {
  throw new Error("K6_TOKEN must be set to a valid bearer token.");
}

const token = rawToken.startsWith("{")
  ? JSON.parse(rawToken).access_token
  : rawToken;

if (!nodeId) {
  throw new Error("K6_NODE_ID must be set to a valid node_id.");
}

export const options = {
  scenarios: {
    read_node_info: {
      executor: "constant-arrival-rate",
      rate: Number(__ENV.K6_RATE) || 50,
      timeUnit: "1s",
      duration: __ENV.K6_DURATION || "2m",
      preAllocatedVUs: Number(__ENV.K6_VUS) || 20,
      maxVUs: Number(__ENV.K6_MAX_VUS) || 50,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const url = `${baseUrl}/nodes/get_node_info?node_id=${encodeURIComponent(nodeId)}`;
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    tags: {
      endpoint: "POST /nodes/get_node_info",
    },
  };

  const response = http.post(url, null, params);

  check(response, {
    "status is 200": (r) => r.status === 200,
  });
}