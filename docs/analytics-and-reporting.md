# FixMyRoad — Advanced Analytics, System Health & Reporting Subsystem

## Overview

FixMyRoad Phase 12 introduces a comprehensive **Advanced Analytics, System Health & Reporting Subsystem**. It aggregates live complaint records, AI defect classifications, resolution cycle timelines, citizen feedback scores, and microservices system health metrics into interactive dashboards, system health monitoring inspectors, and exportable civic audit reports (CSV and JSON formats).

---

## Technical Specifications & Formulas

### 1. MongoDB Aggregation Engine (`$facet`)
- **Total Complaints**: `totalComplaints`
- **Status Distribution**: Real counts for all 8 workflow statuses (`SUBMITTED`, `UNDER_REVIEW`, `ACCEPTED`, `REJECTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`). Returns `0` for missing categories.
- **Road Damage Distribution**: Sorted descending by count (`POTHOLE`, `ROAD_CRACK`, `WATERLOGGING`, etc.).
- **Severity Ratios**: Counts and percentages (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **Resolution Turnaround Velocity**:
  - `averageResolutionHours`: Average duration in hours (`resolvedAt - createdAt`).
  - `medianResolutionHours`: Server-side median calculation from sorted complaint resolution durations.
  - `resolutionByIssueType`: Average turnaround hours grouped per defect type.
- **Resolution Rate Formula**:
  $$\text{resolutionRate} = \frac{\text{resolvedOrClosedComplaints}}{\text{totalComplaints}} \times 100$$
- **Reopen Rate Formula**:
  $$\text{reopenRate} = \frac{\text{acceptedReopenRequests}}{\text{resolvedComplaints}} \times 100$$
- **Citizen Verification Rate Formula**:
  $$\text{citizenVerificationRate} = \frac{\text{citizenVerifiedCount}}{\text{resolvedComplaints}} \times 100$$
- **Citizen Satisfaction Score**: Average 1-5 star rating and rating distribution map.
- **Critical Unresolved Metrics**: Counts critical complaints with unresolved statuses (`SUBMITTED`..`IN_PROGRESS`).

---

## Security & Tenant Isolation

- **Strict Tenant Isolation**: For `MUNICIPALITY_ADMIN` and `MUNICIPALITY_OFFICER`, scope is strictly fixed to `req.user.municipalityId`. Query parameter overrides (e.g. `?municipalityId=MUN002`) are ignored or rejected.
- **Forbidden Citizen Access**: `CITIZEN` role receives `403 Forbidden` for all analytics, export, and system health endpoints.
- **Date Range Limits & Controls**:
  - Validates ISO `from` and `to` parameters (Default: `from = start of current year`, `to = current date`).
  - Enforces `ANALYTICS_MAX_RANGE_DAYS=366`. Requests exceeding 366 days return `400 Bad Request` (`code: "DATE_RANGE_TOO_LARGE"`).
  - Sanitizes input against MongoDB operator injection (`$gt`, `$ne`, `$where`, `$or`).
- **CSV Formula Injection Protection**: Values starting with `=`, `+`, `-`, `@` are prefixed with `'` to prevent spreadsheet formula execution.
- **Export Record Limit**: Enforces `MAX_EXPORT_RECORDS=10000`. Exceeding limit returns `400 Bad Request` (`code: "EXPORT_LIMIT_EXCEEDED"`).
- **Rate Limits**:
  - Analytics: `ANALYTICS_RATE_LIMIT=60/hr`
  - Health: `HEALTH_RATE_LIMIT=120/hr`
  - Export: `EXPORT_RATE_LIMIT=20/hr`

---

## Microservices Health Monitoring Topology

`GET /api/admin/health/system` inspects:
1. **MongoDB Database**: Evaluates connection state (`readyState === 1`), measures ping latency (ms), and performs `admin().ping()`.
2. **FastAPI YOLO AI Microservice**: Non-blocking HTTP GET to `http://localhost:8000/health` (`timeout: 3000ms`, `maxRedirects: 0`) measuring latency (ms).
3. **Cloudinary Image Storage**: Validates credential presence without exposing secret keys.
4. **Outbox Processor**: Returns active job metrics (`pendingJobs`, `processingJobs`, `failedJobs`, `lastProcessedAt`).
5. **Nominatim Reverse Geocoder**: Monitors geocoding availability.

---

## API Endpoints

- `GET /api/municipality/analytics` — Municipal jurisdiction analytics (`MUNICIPALITY_ADMIN`, `MUNICIPALITY_OFFICER`, `SUPER_ADMIN`).
- `GET /api/admin/analytics` — Global multi-tenant analytics (`SUPER_ADMIN`).
- `GET /api/municipality/reports/export?format=csv|json` — Municipal report export (`MUNICIPALITY_ADMIN`, `MUNICIPALITY_OFFICER`, `SUPER_ADMIN`).
- `GET /api/admin/reports/export?format=csv|json` — Global report export (`SUPER_ADMIN`).
- `GET /api/admin/health/system` — Real-time microservices health inspection (`SUPER_ADMIN`).
