# FixMyRoad — Academic Submission Handbook

This manual serves as the technical documentation for the FixMyRoad platform, detailing system architecture, data models, API catalog, and security mechanisms.

---

## 1. System Architecture

```text
                  [ React Client SPA ]
                           │
                  (Axios API Client)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [ HTTP Rate Limiters ]       [ Static Assets ]
             │
             ▼
    [ Express API Server ] ◄───► [ MongoDB (Mongoose) ]
             │
      (HTTP Requests)
             │
             ▼
    [ FastAPI AI Service ]
     (YOLO Road Damage)
```

### Component Roles:
1. **Frontend React SPA**: Handles map rendering (Leaflet), user registration, geocoding, dashboard statistics, and complaint lifecycle transitions.
2. **Express API Server**: Serves as the central backend, handling JWT token issuance, RBAC checks, double-submit CSRF cookie checks, rate limiting, and GeoJSON database spatial routing queries.
3. **FastAPI AI Service**: Hosts the YOLO model to analyze uploaded road defect images, extract damage confidence bounding boxes, and calculate threat severity scores.
4. **MongoDB**: Stores schemas for complaints, histories, audit logs, notifications, and user metadata.

---

## 2. MongoDB Schema Models

### User Schema (`users`)
- `name` (String): Full name of the user.
- `email` (String, Unique): E-mail address for authentication.
- `password` (String): Salted bcrypt hash of password.
- `phone` (String): Phone contact.
- `role` (String): Options: `CITIZEN`, `MUNICIPALITY_ADMIN`, `MUNICIPALITY_OFFICER`, `SUPER_ADMIN`.
- `municipalityId` (ObjectId): References `municipalities` (null for citizens).
- `isActive` (Boolean): Flag indicating if account is active.

### Complaint Schema (`complaints`)
- `complaintId` (String, Unique): Auto-generated ID (`FMR-YYYY-XXXX`).
- `citizenId` (ObjectId): References `users`.
- `imageUrl` (String): Uploaded image link (Cloudinary).
- `latitude` (Number): Latitude coordinate.
- `longitude` (Number): Longitude coordinate.
- `location` (Point Schema): GeoJSON point for 2dsphere spatial indexes.
- `address` (String): Resolved physical address.
- `municipalityId` (ObjectId): References `municipalities`.
- `issueType` (String): E.g. `POTHOLE`, `CRACK`, `MANHOLE`, `DEBRIS`.
- `severity` (String): E.g. `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
- `status` (String): E.g. `SUBMITTED`, `ASSIGNED`, `RESOLVED`, `CLOSED`.

### Notification Outbox Schema (`notificationdeliveries`)
- `notificationEventId` (ObjectId): References parent event.
- `channel` (String): `DASHBOARD`, `EMAIL`, `SMS`, `API`.
- `recipient` (String): Contact information.
- `payload` (Object): Custom message content.
- `status` (String): `PENDING`, `PROCESSING`, `SENT`, `FAILED`, `RETRYING`.
- `attempts` (Number): Retry attempt counter.

---

## 3. Core API Endpoint Catalog

| Endpoint Route | HTTP Method | Access Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/register` | `POST` | Public | Public citizen registration (Forces Citizen role) |
| `/api/auth/login` | `POST` | Public | Login credentials check, issues HttpOnly cookie |
| `/api/complaints` | `POST` | `CITIZEN` | Submit complaint, upload image, perform AI scan |
| `/api/complaints` | `GET` | Authenticated | Fetch paginated, tenant-isolated complaint list |
| `/api/municipality/analytics`| `GET` | Municipal Admins| Jurisdictional analytics dashboard data |
| `/api/admin/health/system` | `GET` | `SUPER_ADMIN` | Inspect MongoDB, AI Service, Outbox latencies |
| `/api/admin/operations/metrics` | `GET` | `SUPER_ADMIN` | Real-time traffic, latency, and error rate cockpit |

---

## 4. Security Architecture Controls

1. **HttpOnly Cookie JWT Authentication**: Prevents client-side scripts from reading tokens.
2. **Double-Submit CSRF cookie checking**: Protects mutating endpoints against state-changing attacks.
3. **MongoDB Operator Injection Protection**: Sanitizes keys containing `$` operators.
4. **SSRF Safeguards**: Validates external URLs against local network IPs.
5. **GPS EXIF Privacy**: Strips camera metadata coordinates from image uploads via Sharp.
6. **Rate Limiting**: Protects login, metrics, health, and general API routes.
