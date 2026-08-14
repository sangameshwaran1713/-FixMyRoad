# FixMyRoad — Complaint Creation & Workflow Architecture

## Overview

FixMyRoad Phase 8 combines Cloudinary image storage, Python FastAPI YOLO AI analysis, Geolocation, Nominatim reverse geocoding, and GeoJSON 2dsphere municipal routing into an end-to-end complaint submission and tracking subsystem.

---

## System Topology & Flow

```text
Citizen User (React Report Issue Page)
   ↓
POST /api/complaints
   ↓
Express Server (authMiddleware, authorizeRoles('CITIZEN'), complaintRateLimiter)
   ↓
Server Validations (Source of Truth):
   1. SSRF Image URL Validation & Redirect-Blocked Cloudinary Check (maxRedirects: 0)
   2. Coordinate Range Validation (-90 <= lat <= 90, -180 <= lon <= 180)
   3. Server-Side Reverse Geocoding (reverseGeocode)
   4. Server-Side GeoJSON Municipality Resolution ($geoIntersects)
   5. Server-Side AI Analysis Execution (analyzeRoadImageWithAI)
   6. Derive citizenId strictly from req.user._id
   7. Generate sequential Complaint ID (FMR-2026-XXXXX)
   8. Force initial status = "SUBMITTED"
   ↓
Mongoose Transaction Session (or safe fallback):
   - Create Complaint
   - Create initial ComplaintHistory (oldStatus: null, newStatus: "SUBMITTED")
   - Create AuditLog (COMPLAINT_CREATED)
   - Create Notification (COMPLAINT_CREATED)
   ↓
Return JSON Response with FMR Complaint ID → React Success Page
```

---

## Core Security Rules — Server as Source of Truth

1. **Client Cannot Override Fields**:
   - Clients CANNOT send or override `citizenId`, `municipalityId`, `status`, `complaintId`, `severity`, `aiConfidence`, `issueType`, or `createdAt`. The server derives and validates all authoritative fields.

2. **Redirect-Blocked Cloudinary Verification**:
   - Image URL verification disables automatic redirects (`maxRedirects: 0`) to prevent SSRF redirect bypasses to untrusted or internal network hosts.

3. **Server-Side AI Execution**:
   - The server re-runs AI prediction (`analyzeRoadImageWithAI`) during submission rather than trusting any client-supplied AI results.
   - Configurable `ALLOW_AI_UNAVAILABLE_SUBMISSION=false`. If AI microservice model is unconfigured (`modelLoaded === false`) and flag is false, complaint submission is safely rejected with `code: "AI_UNAVAILABLE"`.

4. **Transparent Transaction Logging**:
   - The backend attempts Mongoose/MongoDB session transactions for atomic writes. It explicitly logs whether replica-set transaction support was active or if standalone single-document fallback was executed.

5. **RBAC Ownership & Access Control**:
   - **CITIZEN**: Can submit complaints and view ONLY their own complaints (`GET /api/complaints/my` and `GET /api/complaints/:complaintId`).
   - **MUNICIPALITY_ADMIN**: Can view ONLY complaints assigned to their municipality (`municipalityId === user.municipalityId`).
   - **SUPER_ADMIN**: Holds global access across all system complaints.

---

## API Specifications

### 1. Submit Complaint: `POST /api/complaints`
**Authentication**: Required (`CITIZEN` only)  
**Rate Limit**: 10 submissions / hour per IP (`COMPLAINT_CREATE_RATE_LIMIT`)

#### Request Payload:
```json
{
  "imageUrl": "https://res.cloudinary.com/demo/image/upload/v123456/road_photo.jpg",
  "description": "Large pothole near the main entrance gate",
  "location": {
    "latitude": 11.0168,
    "longitude": 76.9558,
    "accuracy": 8,
    "source": "GPS"
  }
}
```

#### Successful Response (`201 Created`):
```json
{
  "success": true,
  "message": "Complaint submitted successfully",
  "data": {
    "complaint": {
      "complaintId": "FMR-2026-00001",
      "issueType": "POTHOLE",
      "severity": "HIGH",
      "aiConfidence": 0.94,
      "status": "SUBMITTED",
      "municipalityId": {
        "id": "60d5ecb8b3b3a123456789ab",
        "name": "Demo Central Zone",
        "code": "MUN001"
      },
      "location": {
        "type": "Point",
        "coordinates": [76.9558, 11.0168]
      },
      "address": "Avinashi Road, Peelamedu",
      "createdAt": "2026-08-08T10:15:00.000Z"
    }
  }
}
```

### 2. Get Citizen Complaints: `GET /api/complaints/my?page=1&limit=10&status=SUBMITTED`
**Authentication**: Required (`CITIZEN` only)

### 3. Get Single Complaint Details: `GET /api/complaints/:complaintId`
**Authentication**: Required (RBAC ownership checks enforced)

### 4. Get Status History Timeline: `GET /api/complaints/:complaintId/history`
**Authentication**: Required (RBAC ownership checks enforced)

### 5. Get User Notifications: `GET /api/notifications/my`
**Authentication**: Required

---

## Status Lifecycle & Future Workflow Foundation

```text
SUBMITTED (Initial Phase 8 State)
   ↓
UNDER_REVIEW / ACCEPTED / REJECTED
   ↓
ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
```
