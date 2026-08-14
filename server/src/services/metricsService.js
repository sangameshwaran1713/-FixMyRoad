/**
 * Real-time Application Operational Metrics Service
 * Collects runtime performance, HTTP traffic, error rates, and endpoint statistics without fake data.
 */

class MetricsService {
  constructor() {
    this.startTime = Date.now();
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.totalResponseTimeMs = 0;
    this.slowRequestsCount = 0;
    this.status4xxCount = 0;
    this.status5xxCount = 0;
    this.authenticationFailures = 0;
    this.rateLimitHits = 0;
    this.endpointStats = new Map();
  }

  recordRequest(req, res, durationMs) {
    const statusCode = res.statusCode;
    const path = req.baseUrl || req.path || req.originalUrl || 'unknown';
    const method = req.method;
    const endpointKey = `${method} ${path}`;

    this.totalRequests += 1;
    this.totalResponseTimeMs += durationMs;

    const slowThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD_MS || '1000', 10);
    if (durationMs > slowThreshold) {
      this.slowRequestsCount += 1;
    }

    if (statusCode >= 200 && statusCode < 400) {
      this.successfulRequests += 1;
    } else {
      this.failedRequests += 1;
      if (statusCode >= 400 && statusCode < 500) {
        this.status4xxCount += 1;
        if (statusCode === 401 || statusCode === 403) {
          this.authenticationFailures += 1;
        }
        if (statusCode === 429) {
          this.rateLimitHits += 1;
        }
      } else if (statusCode >= 500) {
        this.status5xxCount += 1;
      }
    }

    // Record Endpoint-Level Metrics
    if (!this.endpointStats.has(endpointKey)) {
      this.endpointStats.set(endpointKey, {
        endpoint: endpointKey,
        count: 0,
        errors: 0,
        totalDurationMs: 0,
        minDurationMs: durationMs,
        maxDurationMs: durationMs,
      });
    }

    const stat = this.endpointStats.get(endpointKey);
    stat.count += 1;
    stat.totalDurationMs += durationMs;
    if (statusCode >= 400) stat.errors += 1;
    if (durationMs < stat.minDurationMs) stat.minDurationMs = durationMs;
    if (durationMs > stat.maxDurationMs) stat.maxDurationMs = durationMs;
  }

  getMetrics() {
    const avgResponseTime = this.totalRequests > 0 ? Math.round((this.totalResponseTimeMs / this.totalRequests) * 10) / 10 : 0;
    const errorRate = this.totalRequests > 0 ? Math.round((this.failedRequests / this.totalRequests) * 10000) / 100 : 0;

    const topEndpoints = Array.from(this.endpointStats.values())
      .map((stat) => ({
        endpoint: stat.endpoint,
        requestCount: stat.count,
        errorCount: stat.errors,
        avgDurationMs: Math.round((stat.totalDurationMs / stat.count) * 10) / 10,
        maxDurationMs: stat.maxDurationMs,
      }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 15);

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      errorRatePercent: errorRate,
      averageResponseTimeMs: avgResponseTime,
      slowRequestsCount: this.slowRequestsCount,
      status4xxCount: this.status4xxCount,
      status5xxCount: this.status5xxCount,
      authenticationFailures: this.authenticationFailures,
      rateLimitHits: this.rateLimitHits,
      topEndpoints,
    };
  }
}

export const metricsService = new MetricsService();
