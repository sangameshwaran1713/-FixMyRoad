# FixMyRoad — GPS Location, Interactive Maps & Reverse Geocoding Architecture

## Overview

FixMyRoad Phase 5 implements the geographic location subsystem combining browser GPS positioning, Leaflet interactive mapping, manual coordinate selection, and Express reverse geocoding.

---

## System Topology & Flow

```text
React Client
   ↓
[Detect My Location] (navigator.geolocation.getCurrentPosition) OR [Select on Leaflet Map]
   ↓
Coordinates (Latitude, Longitude, Accuracy)
   ↓
GET /api/geocoding/reverse?lat=<lat>&lon=<lon> (Axios request via Express API)
   ↓
Express Server
   ↓
authMiddleware (JWT Session Check)
   ↓
geocodingRateLimiter (Rate limiting protection)
   ↓
Coordinate Validation (-90 <= lat <= 90, -180 <= lon <= 180)
   ↓
In-Memory Cache Check
   ↓
Geocoding Service (OpenStreetMap Nominatim with User-Agent header)
   ↓
Normalized Address Payload
   ↓
React Location State & Confirmation
```

---

## Geocoding API Specification

**Endpoint**: `GET /api/geocoding/reverse`  
**Query Parameters**:
- `lat` (required): Latitude number (`-90` to `90`)
- `lon` (required): Longitude number (`-180` to `180`)

**Authentication**: Required (HttpOnly Cookie or Bearer Token)

### Sample Request:
`GET /api/geocoding/reverse?lat=11.0168&lon=76.9558`

### Successful Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "latitude": 11.0168,
    "longitude": 76.9558,
    "address": "Avinashi Road, Peelamedu",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "country": "India",
    "postalCode": "641004"
  }
}
```

### Error Responses:
- `400 Bad Request`: Missing query parameters or invalid coordinate range (e.g. `lat=999`).
- `401 Unauthorized`: Unauthenticated request.
- `429 Too Many Requests`: Geocoding rate limit exceeded (`GEOCODING_RATE_LIMIT=30`).

---

## Technical Features & Architectural Safeguards

1. **Strict Client-Backend Proxy**:
   - React components NEVER call Nominatim or third-party geocoders directly. All geocoding flows securely through the Express API backend.

2. **GeoJSON Coordinate Formatting**:
   - GeoJSON specifications require `[longitude, latitude]` array ordering. The system normalizes longitude and latitude fields explicitly to prevent coordinate inversion bugs.

3. **No Continuous Tracking**:
   - Browser geolocation uses a one-time `getCurrentPosition` request with `enableHighAccuracy: true`. `watchPosition` is strictly avoided to protect user battery and privacy.

4. **Leaflet & OpenStreetMap Attribution**:
   - Map tiles are rendered using `react-leaflet` and OpenStreetMap. Full OpenStreetMap copyright attribution is embedded on all renders.

5. **In-Memory Caching**:
   - Geocoding queries are cached in memory based on rounded 4-decimal coordinates (~11m resolution) for 1 hour to prevent redundant external API calls.

6. **No Complaint Document Creation**:
   - In Phase 5, confirmed coordinates and address data are stored exclusively in React state. Complaint MongoDB persistence will be handled in Phase 8.
