/**
 * K6 Performance Test for MemoLink API
 * Tests GET /api/memories endpoint with load
 * 
 * Run with: k6 run performance-test.js
 * Or with options: k6 run --vus 50 --duration 30s performance-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users over 30s
    { duration: '1m', target: 50 },   // Ramp up to 50 users over 1 minute
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '1m', target: 100 },  // Stay at 100 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% of requests should be below 500ms
    'http_req_duration': ['p(99)<1000'], // 99% of requests should be below 1000ms
    'errors': ['rate<0.1'],              // Error rate should be below 10%
    'http_req_failed': ['rate<0.1'],     // Failed requests should be below 10%
  },
};

// Base URL - update this to match your server
const BASE_URL = 'http://localhost:8000';

// Setup function - runs once before the test
export function setup() {
  // Test health endpoint first
  const healthRes = http.get(`${BASE_URL}/api/health`);
  console.log('🏥 Health check:', healthRes.status, healthRes.body);
  
  // Try to login to get a valid token
  // NOTE: Update these credentials to match your test user
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'your_test_password',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    const token = loginRes.json('access_token');
    console.log('✅ Login successful, token obtained');
    return { token, hasAuth: true };
  } else {
    console.log('⚠️ Login failed, testing without authentication');
    console.log('Status:', loginRes.status);
    return { token: 'dummy-token', hasAuth: false };
  }
}

// Main test function - runs for each VU iteration
export default function (data) {
  // Test health endpoint (no auth required)
  const healthRes = http.get(`${BASE_URL}/api/health`);
  
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  if (!data.hasAuth) {
    // If no auth, just test public endpoints
    responseTime.add(healthRes.timings.duration);
    sleep(Math.random() * 2 + 1);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Test 1: GET all memories
  const memoriesRes = http.get(`${BASE_URL}/api/memories`, { headers });
  
  // Record metrics
  responseTime.add(memoriesRes.timings.duration);
  
  // Check response
  const success = check(memoriesRes, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
    'response has data': (r) => r.body.length > 0,
    'response is JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
  });

  // Record errors
  errorRate.add(!success);

  // Test 2: GET single memory (if memories exist)
  if (memoriesRes.status === 200 && memoriesRes.json().length > 0) {
    const memories = memoriesRes.json();
    const randomMemory = memories[Math.floor(Math.random() * memories.length)];
    
    const singleMemoryRes = http.get(`${BASE_URL}/api/memories/${randomMemory.id}`, { headers });
    
    check(singleMemoryRes, {
      'single memory status is 200': (r) => r.status === 200,
      'single memory response time < 500ms': (r) => r.timings.duration < 500,
    });
  }

  // Test 3: GET connections
  const connectionsRes = http.get(`${BASE_URL}/api/connections`, { headers });
  
  check(connectionsRes, {
    'connections status is 200': (r) => r.status === 200,
    'connections response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Simulate user think time (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('Performance test completed');
}

// Handle summary - customize the output
export function handleSummary(data) {
  return {
    'performance-test-results.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Helper function to create text summary
function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n' + indent + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  summary += indent + '  Performance Test Results\n';
  summary += indent + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  // Requests
  const requests = data.metrics.http_reqs.values.count;
  const failed = data.metrics.http_req_failed.values.rate * 100;
  summary += indent + `Total Requests: ${requests}\n`;
  summary += indent + `Failed Requests: ${failed.toFixed(2)}%\n\n`;
  
  // Response times
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  const p99 = data.metrics.http_req_duration.values['p(99)'];
  const avg = data.metrics.http_req_duration.values.avg;
  
  summary += indent + 'Response Times:\n';
  summary += indent + `  Average: ${avg.toFixed(2)}ms\n`;
  summary += indent + `  p(95): ${p95.toFixed(2)}ms\n`;
  summary += indent + `  p(99): ${p99.toFixed(2)}ms\n\n`;
  
  // Thresholds
  summary += indent + 'Threshold Status:\n';
  for (const [name, threshold] of Object.entries(data.metrics)) {
    if (threshold.thresholds) {
      for (const [thresholdName, result] of Object.entries(threshold.thresholds)) {
        const status = result.ok ? '✓' : '✗';
        summary += indent + `  ${status} ${thresholdName}\n`;
      }
    }
  }
  
  summary += indent + '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  
  return summary;
}
