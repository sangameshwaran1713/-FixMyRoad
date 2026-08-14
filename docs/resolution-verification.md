# FixMyRoad — Citizen Resolution Verification, Feedback & Reopen Subsystem

## Overview

FixMyRoad Phase 11 introduces a **Citizen Resolution Verification and Feedback System**. When a municipality marks a complaint as `RESOLVED`, the reporting citizen receives a notification to verify the repair.

If satisfied, the citizen submits a 5-star rating and feedback, setting `citizenVerified = true` and transitioning the complaint from `RESOLVED` to `CLOSED`.

If dissatisfied, the citizen submits a `ReopenRequest` with a mandatory reason and fresh photo evidence (EXIF stripped for privacy). The complaint remains `RESOLVED` while `ReopenRequest.status = 'PENDING'`. Municipality Admins inspect the request on a side-by-side comparison page:
- **Accept**: Moves complaint `RESOLVED` → `UNDER_REVIEW`, increments `resolutionCycle`, and notifies citizen.
- **Reject**: Requires a review comment; complaint remains `RESOLVED`.

---

## State Machine & Resolution Cycles Workflow

```text
                  Municipality Repair Completed
                                │
                                ▼
                             RESOLVED
                                │
                      Citizen Verification Prompt
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
           Satisfied                         Not Fixed
               │                                 │
     Submit 5-Star Rating                  ReopenRequest
               │                            (PENDING)
               ▼                                 │
            CLOSED                       Municipal Review
                                         ┌───────┴───────┐
                                         ▼               ▼
                                      Accept           Reject
                                         │               │
                                         ▼               ▼
                                   UNDER_REVIEW       RESOLVED
                                  (Cycle += 1)
```

---

## Security & Data Integrity Safeguards

1. **Strict Citizen Ownership**:
   - Backend derives citizen identity strictly from `req.user._id`.
   - Citizens can ONLY submit feedback or reopen requests for their OWN complaints (`complaint.citizenId.toString() === req.user._id.toString()`). Attempting cross-account feedback returns `403 Forbidden`.

2. **Strict Municipal Isolation**:
   - Municipality Admins can ONLY view, accept, or reject reopen requests assigned to their jurisdiction (`reopenRequest.municipalityId.toString() === req.user.municipalityId.toString()`).

3. **Resolution Cycle Isolation**:
   - `Complaint` tracks `resolutionCycle` (default 1).
   - `ComplaintFeedback` documents are bound to `(complaintId, resolutionCycle, citizenId)` via a compound unique index, allowing distinct feedback submissions per resolution cycle.

4. **EXIF Metadata Stripping**:
   - Uploaded reopen evidence photos are processed through Sharp to strip EXIF GPS metadata before storing on Cloudinary under `fixmyroad/reopen-evidence/{year}/{month}/`.

5. **Rate Limiting**:
   - Feedback submissions limited by `feedbackRateLimiter` (`FEEDBACK_RATE_LIMIT=20`).
   - Reopen requests limited by `reopenRateLimiter` (`REOPEN_RATE_LIMIT=10`).

---

## API Specifications

### 1. Submit Citizen Feedback: `POST /api/complaints/:complaintId/feedback`
**Authentication**: Required (`CITIZEN` - Owner only)  
**Body**:
```json
{
  "rating": 5,
  "comment": "The pothole has been properly repaired."
}
```
**Effect**: Creates `ComplaintFeedback`, sets `citizenVerified = true`, `citizenVerifiedAt`, `citizenRating`, transitions status `RESOLVED` → `CLOSED`.

### 2. Submit Reopen Request: `POST /api/complaints/:complaintId/reopen`
**Authentication**: Required (`CITIZEN` - Owner only)  
**Body**:
```json
{
  "reason": "The damage was only partially filled.",
  "imageUrl": "https://res.cloudinary.com/..."
}
```
**Effect**: Creates `ReopenRequest` (`status: PENDING`), complaint status remains `RESOLVED`, creates municipal Outbox alert.

### 3. List Municipal Reopen Requests: `GET /api/municipality/reopen-requests`
**Authentication**: Required (`MUNICIPALITY_ADMIN`, `MUNICIPALITY_OFFICER`, `SUPER_ADMIN`)

### 4. Accept Reopen Request: `PATCH /api/municipality/reopen-requests/:id/accept`
**Authentication**: Required (`MUNICIPALITY_ADMIN`, `SUPER_ADMIN`)  
**Effect**: Sets `ReopenRequest.status = ACCEPTED`, transitions complaint `RESOLVED` → `UNDER_REVIEW` (increments `resolutionCycle`), notifies citizen.

### 5. Reject Reopen Request: `PATCH /api/municipality/reopen-requests/:id/reject`
**Authentication**: Required (`MUNICIPALITY_ADMIN`, `SUPER_ADMIN`)  
**Body**:
```json
{
  "comment": "On-site inspection confirms repair meets municipal safety standards."
}
```
**Effect**: Sets `ReopenRequest.status = REJECTED`, complaint remains `RESOLVED`, notifies citizen.
