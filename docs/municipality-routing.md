# FixMyRoad — Municipality Detection & Smart Routing Architecture

## Overview

FixMyRoad Phase 7 implements automatic server-side municipal routing from confirmed GPS coordinates using **MongoDB 2dsphere geospatial indexing** and **GeoJSON `$geoIntersects` polygon boundary queries**.

---

## System Topology & Flow

```text
Confirmed GPS Coordinates (Latitude, Longitude)
   ↓
GeoJSON Point [longitude, latitude]
   ↓
POST /api/municipalities/resolve
   ↓
Express Server (authMiddleware, authorizeRoles, municipalityRateLimiter)
   ↓
Municipality Service (findMunicipalityByCoordinates)
   ↓
MongoDB 2dsphere Query ($geoIntersects on boundary)
   ↓
Matches Evaluation:
   - 1 Match   → MUNICIPALITY_FOUND (Return authority details)
   - 0 Matches → MUNICIPALITY_NOT_FOUND
   - >1 Matches→ AMBIGUOUS_MUNICIPALITY
   ↓
React Report Page State Update
```

---

## Technical Features & Security Safeguards

1. **NO City-Name / Address Text Guessing**:
   - Routing is executed exclusively via server-side `$geoIntersects` spatial boundary intersection queries. Text fields from reverse geocoding are NEVER used to guess municipal jurisdiction.

2. **Server-Side Authority Determination**:
   - Clients CANNOT send or override `municipalityId` to force routing. The server resolves the authority strictly from confirmed GPS coordinates.

3. **GeoJSON Coordinate Formatting**:
   - GeoJSON specifications require `[longitude, latitude]` ordering. The backend converts `(latitude, longitude)` inputs into `Point [longitude, latitude]` explicitly to prevent coordinate inversion bugs.

4. **Municipality Admin Isolation**:
   - `municipalityAccessMiddleware.js` verifies that `MUNICIPALITY_ADMIN` users can only manage operations within their assigned `municipalityId`. `SUPER_ADMIN` holds global system authorization.

5. **2dsphere Indexing**:
   - MongoDB `Municipality` schema enforces a `2dsphere` index on `boundary`:
     ```javascript
     municipalitySchema.index({ boundary: '2dsphere' });
     ```

---

## API Specification

### Endpoint: `POST /api/municipalities/resolve`
**Authentication**: Required (`CITIZEN`, `MUNICIPALITY_ADMIN`, `SUPER_ADMIN`)  
**Rate Limit**: 60 requests / hour per IP (`MUNICIPALITY_RESOLVE_RATE_LIMIT`)

### Request Payload:
```json
{
  "latitude": 11.0168,
  "longitude": 76.9558
}
```

### Successful Response (`200 OK` - Match Found):
```json
{
  "success": true,
  "code": "MUNICIPALITY_FOUND",
  "message": "Responsible municipality boundary identified successfully",
  "data": {
    "municipality": {
      "id": "60d5ecb8b3b3a123456789ab",
      "name": "Demo Central Zone",
      "code": "MUN001",
      "state": "Tamil Nadu",
      "district": "Coimbatore Demo Region",
      "contactEmail": "demo.central@fixmyroad.local",
      "contactPhone": "+91 422 2300000",
      "notificationMethod": "DASHBOARD"
    },
    "coordinates": {
      "latitude": 11.0168,
      "longitude": 76.9558
    },
    "routingMethod": "GEOJSON_BOUNDARY"
  }
}
```

---

## Synthetic Demo Boundary Test Matrix

Run `npm run seed:municipality-boundaries` to populate synthetic demo polygon boundaries and test coordinates:

| Location | Coordinates | Enclosing Polygon | Expected Code | Expected Authority |
| :--- | :--- | :--- | :--- | :--- |
| **Point A (Central)** | `lat: 11.0168, lon: 76.9558` | `[76.94, 11.00]` to `[76.98, 11.04]` | `MUNICIPALITY_FOUND` | `MUN001` (Demo Central Zone) |
| **Point B (North)** | `lat: 11.0600, lon: 76.9558` | `[76.94, 11.05]` to `[76.98, 11.10]` | `MUNICIPALITY_FOUND` | `MUN002` (Demo North Zone) |
| **Point C (South)** | `lat: 10.9500, lon: 76.9558` | `[76.94, 10.90]` to `[76.98, 10.98]` | `MUNICIPALITY_FOUND` | `MUN003` (Demo South Zone) |
| **Outside Point** | `lat: 28.6139, lon: 77.2090` | Outside all polygons | `MUNICIPALITY_NOT_FOUND` | No Municipality Found |
| **Invalid Coords** | `lat: 999, lon: 999` | Invalid numeric range | `INVALID_COORDINATES` | `400 Bad Request` |

---

> [!IMPORTANT]
> The seeded boundaries are synthetic development polygons constructed specifically to test spatial indexing. In production, these should be replaced with official municipal GIS boundary data.
