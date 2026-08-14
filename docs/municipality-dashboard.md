# FixMyRoad — Municipality Admin Dashboard & Complaint Management Architecture

## Overview

FixMyRoad Phase 10 implements the **Municipality Admin Dashboard** and end-to-end complaint processing lifecycle engine. It features strict municipal tenant isolation, a rigid status transition state machine, officer assignment, resolution proof image uploads via Cloudinary, and Super Admin system oversight.

---

## System Topology & Status Lifecycle State Machine

```text
MUNICIPALITY_ADMIN / MUNICIPALITY_OFFICER Login
        ↓
GET /api/municipality/dashboard/stats & /api/municipality/complaints
        ↓
Strict Tenant Isolation Check (req.user.municipalityId === complaint.municipalityId)
        ↓
Open Complaint Details → Inspect Photo, YOLO Bounding Boxes, Severity, Leaflet Map, Address, Description
        ↓
Status Transition Workflow Engine:

   SUBMITTED ─────────► UNDER_REVIEW
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
         ACCEPTED                          REJECTED (Requires Reason)
            │
            ▼ (Assign Officer)
         ASSIGNED
            │
            ▼
        IN_PROGRESS
            │
            ▼ (Resolution Proof Photo + Notes)
         RESOLVED (Sets resolvedAt)
            │
            ▼
          CLOSED
        ↓
Citizen Notification Dispatched (COMPLAINT_STATUS_CHANGED)
```

---

## Core Security & Tenant Isolation Rules

1. **Strict Tenant Isolation**:
   - `MUNICIPALITY_ADMIN` and `MUNICIPALITY_OFFICER` users can ONLY view, filter, assign, and process complaints belonging to their assigned `municipalityId`.
   - The backend derives tenant scope strictly from `req.user.municipalityId`. Tenant parameters passed via query strings or request bodies are ignored for authorization.

2. **Role Hierarchy**:
   ```text
   SUPER_ADMIN (Global System Oversight)
        ↓
   MUNICIPALITY_ADMIN (Municipal Management, Officer Assignment, Status Updates)
        ↓
   MUNICIPALITY_OFFICER (Assigned Municipal Work Orders, Status Updates)
        ↓
   CITIZEN (Defect Reporting & Personal Complaint Tracking)
   ```

3. **Invalid Transition Rejection**:
   - Status updates violating allowed state machine branches (e.g. `SUBMITTED` → `RESOLVED`, `CLOSED` → `IN_PROGRESS`) are rejected with `400 Bad Request` (`code: "INVALID_STATUS_TRANSITION"`).

4. **Server Source of Truth**:
   - Clients CANNOT mutate `citizenId`, `municipalityId`, `complaintId`, `createdAt`, `aiConfidence`, `issueType`, `severity`, or `location` through status updates.

5. **Resolution Image Authorization**:
   - Evidence photo uploads use Multer, Sharp, and Cloudinary stored under `fixmyroad/resolutions`. Permanent local disk storage is prohibited.

---

## API Specifications

### 1. Get Municipal Dashboard Metrics: `GET /api/municipality/dashboard/stats`
**Authentication**: Required (`MUNICIPALITY_ADMIN`, `MUNICIPALITY_OFFICER`)

### 2. Get Paginated Municipal Complaints: `GET /api/municipality/complaints`
**Authentication**: Required (`MUNICIPALITY_ADMIN`, `MUNICIPALITY_OFFICER`)  
**Query Parameters**: `page`, `limit` (max 50), `status`, `severity`, `issueType`, `search`, `sort` (`newest`, `oldest`, `severity`, `updated`), `from`, `to`

### 3. Get Single Complaint Details: `GET /api/municipality/complaints/:complaintId`
**Authentication**: Required (`MUNICIPALITY_ADMIN`, `MUNICIPALITY_OFFICER`, `SUPER_ADMIN`)

### 4. Update Complaint Status: `PATCH /api/municipality/complaints/:complaintId/status`
**Authentication**: Required (`MUNICIPALITY_ADMIN`, `MUNICIPALITY_OFFICER`)  
**Rate Limit**: 60 updates / hour per IP (`MUNICIPALITY_STATUS_RATE_LIMIT`)

### 5. Assign Officer: `PATCH /api/municipality/complaints/:complaintId/assign`
**Authentication**: Required (`MUNICIPALITY_ADMIN`)  
**State Transition**: Moves complaint status `ACCEPTED` → `ASSIGNED`.

### 6. Upload Resolution Evidence Photo: `POST /api/municipality/complaints/:complaintId/resolution-image`
**Authentication**: Required (`MUNICIPALITY_ADMIN`, `MUNICIPALITY_OFFICER`)
