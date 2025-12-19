/**
 * K6 Simple Performance Test for MemoLink API
 * Tests GET /api/health endpoint with moderate load
 * 
 * Run with: k6 run performance-test-simple.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration - Moderate load suitable for local testing
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 25 },   // Ramp up to 25 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '30s', target: 50 },  // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% of requests < 500ms
    'http_req_duration': ['p(99)<1000'], // 99% of requests < 1000ms
    'errors': ['rate<0.1'],              // Error rate < 10%
    'http_req_failed': ['rate<0.05'],    // Failed requests < 5%
  },
};

const BASE_URL = 'http://localhost:8000';

// Setup - run once before test
export function setup() {
  const healthRes = http.get(`${BASE_URL}/api/health`);
  console.log('🏥 Health check:', healthRes.status);
  
  if (healthRes.status !== 200) {
    console.log('⚠️ Server not responding properly');
    return { hasServer: false };
  }
  
  console.log('✅ Server is ready');
  return { hasServer: true };
}

// Main test function
export default function (data) {
  if (!data.hasServer) {
    return;
  }

  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  
  responseTime.add(healthRes.timings.duration);
  
  const success = check(healthRes, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
    'response is JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    'has status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'ok';
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!success);
  
  // Random sleep between 1-3 seconds
  sleep(Math.random() * 2 + 1);
}

// Teardown - run once after test
export function teardown(data) {
  console.log('✅ Performance test completed');
}

// Summary report
export function handleSummary(data) {
  const { metrics } = data;
  
  console.log('\n========================================');
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('========================================');
  
  if (metrics.http_req_duration) {
    console.log('\n⏱️  Response Times:');
    console.log(`   Average: ${metrics.http_req_duration.values.avg.toFixed(2)}ms`);
    console.log(`   Median:  ${metrics.http_req_duration.values.med.toFixed(2)}ms`);
    console.log(`   Min:     ${metrics.http_req_duration.values.min.toFixed(2)}ms`);
    console.log(`   Max:     ${metrics.http_req_duration.values.max.toFixed(2)}ms`);
    console.log(`   P95:     ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
    console.log(`   P99:     ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  }
  
  if (metrics.http_reqs) {
    console.log(`\n📈 Total Requests: ${metrics.http_reqs.values.count}`);
    console.log(`   Rate: ${metrics.http_reqs.values.rate.toFixed(2)} req/s`);
  }
  
  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    console.log(`\n❌ Failed Requests: ${failRate}%`);
  }
  
  if (metrics.checks) {
    const passRate = (metrics.checks.values.passes / metrics.checks.values.value * 100).toFixed(2);
    console.log(`\n✅ Check Pass Rate: ${passRate}%`);
  }
  
  console.log('\n========================================\n');
  
  return {
    'stdout': '', // Suppress default summary
  };
}
