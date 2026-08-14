# FixMyRoad — Automated Municipality Notifications & Outbox Subsystem

## Overview

FixMyRoad Phase 9 implements an asynchronous **Transactional Outbox Notification Pattern** for automated municipal alerts. When a road damage complaint is created, pending outbox records are saved atomically, and a background poller delivers notifications across **Dashboard**, **Email (Nodemailer/SMTP)**, **SMS**, and **Webhook API** channels without blocking HTTP request execution.

---

## System Topology & Flow

```text
Citizen Submits Complaint (POST /api/complaints)
   ↓
Mongoose Transaction Session:
   1. Create Complaint
   2. Create ComplaintHistory (SUBMITTED)
   3. Create AuditLog (COMPLAINT_CREATED)
   4. Create Citizen Notification (COMPLAINT_CREATED)
   5. Create Outbox NotificationEvent & NotificationDelivery (NEW_COMPLAINT, status: PENDING)
   ↓
Return HTTP 201 Created Response Immediately → Citizen sees FMR-2026-00001 ID
   ↓
Background Notification Processor (Polling Loop every 10s):
   1. Claim pending deliveries (status: PROCESSING)
   2. Dispatch to channel provider (Dashboard, Nodemailer/SMTP, SMS, Webhook API)
   3. Record delivery result (SENT or RETRYING with exponential backoff)
   4. Authoritatively update NotificationEvent aggregate status (SENT / RETRYING / PARTIAL_FAILED / FAILED)
```

---

## Failure Isolation & Outbox Architecture

1. **Complaint Failure Isolation**:
   - HTTP complaint submission (`POST /api/complaints`) NEVER blocks on or synchronously invokes external email, SMS, or webhook providers. If an external provider is down, the complaint creation request returns `201 Created` immediately.

2. **Authoritative Delivery & Aggregate Event Status Rules**:
   - `NotificationDelivery` tracks individual channel delivery states.
   - `NotificationEvent.status` is calculated from aggregate delivery states:
     - All channel deliveries `SENT` → `SENT`
     - Any channel delivery `RETRYING` or `PENDING` → `RETRYING`
     - Some channel deliveries `FAILED` & none `RETRYING`/`PENDING` → `PARTIAL_FAILED`
     - All channel deliveries `FAILED` → `FAILED`

3. **Strict Credential Enforcement**:
   - In production mode (`NOTIFICATION_DELIVERY_MODE=smtp` or `real`), if SMTP credentials are missing, system throws an explicit configuration error. Silent fallback to mock mode is strictly disallowed in production.

4. **Delivery Idempotency**:
   - `NotificationDelivery` enforces a compound unique index:
     ```javascript
     notificationDeliverySchema.index(
       { notificationEventId: 1, channel: 1, recipient: 1 },
       { unique: true }
     );
     ```
   - Prevents duplicate email/SMS generation upon processor restarts.

5. **SSRF & Redirect Protections**:
   - Webhook API delivery validates target URLs against internal IP ranges (`127.0.0.1`, `localhost`, `10.x.x.x`, `192.168.x.x`, `172.16-31.x.x`, `file://`) and blocks redirects (`maxRedirects: 0`).

6. **HTML Injection Sanitization**:
   - Email templates sanitize and escape dynamic inputs (`description`, `address`, `municipalityName`, `issueType`) via `escapeHtml()`.

---

## Retry Strategy & Exponential Backoff

When a delivery attempt encounters a retryable network or provider failure:
- **Attempt 1**: Immediate
- **Attempt 2**: +1 minute
- **Attempt 3**: +5 minutes
- **Attempt 4**: +15 minutes
- **Attempt 5**: +60 minutes
- **After 5 Attempts**: Delivery marked as `FAILED`.

### Stale Processing Lock Recovery
If a delivery remains in `PROCESSING` state for > 10 minutes (`NOTIFICATION_PROCESSING_TIMEOUT_MS=600000`) due to an unexpected worker crash, the poller automatically resets status back to `RETRYING`.

---

## API Specifications

### 1. Inspect Outbox Event Status: `GET /api/notification-events/:eventId`
**Authentication**: Required (`SUPER_ADMIN` or assigned `MUNICIPALITY_ADMIN`)

### 2. Manually Retry Failed Deliveries: `POST /api/notification-events/:eventId/retry`
**Authentication**: Required (`SUPER_ADMIN` or assigned `MUNICIPALITY_ADMIN`)
