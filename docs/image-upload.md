# FixMyRoad — Image Upload & Storage Architecture

## Overview

FixMyRoad Phase 4 implements an in-memory image upload, validation, and cloud storage pipeline for road damage reporting.

---

## Architecture Sequence

```text
React Client
   ↓
POST /api/uploads/road-image (multipart/form-data)
   ↓
Express Server
   ↓
authMiddleware (JWT Verify) & roleMiddleware (CITIZEN authorization)
   ↓
uploadRateLimiter (Rate limiting protection)
   ↓
Multer (in-memory Storage, 10MB limit)
   ↓
Sharp (Binary inspection, EXIF stripping, Dimension check 320px–10000px, Auto-orientation)
   ↓
Cloudinary (Stream Upload to fixmyroad/road-reports/{year}/{month}/)
   ↓
Secure HTTPS URL (secure_url)
   ↓
Return JSON Response to React Client
```

---

## Technical Specifications

### 1. Storage Strategy
- **Multer Memory Storage**: Files are processed entirely in memory as a `Buffer`. No temporary image files are permanently saved to the server disk.
- **Cloudinary Path**: Images are organized under `fixmyroad/road-reports/{year}/{month}/`.

### 2. Sharp Image Validation & Processing Rules
- **Binary Inspection**: Deep binary validation prevents spoofed file extensions or corrupted binaries.
- **Allowed Formats**: JPEG, PNG, WEBP.
- **Dimension Boundaries**:
  - Minimum: `320px × 240px`
  - Maximum: `10000px × 10000px`
- **EXIF Privacy Stripping**: Hidden camera EXIF metadata and device serials are stripped to protect user privacy.
- **Quality Preservation**: Compressed cleanly at 85% quality without destroying fine cracks or potholes required for future AI detection.

### 3. API Specification

**Endpoint**: `POST /api/uploads/road-image`  
**Authentication**: Required (HttpOnly Cookie / Bearer Token)  
**Authorization**: `CITIZEN` role only  
**Request Header**: `Content-Type: multipart/form-data`  
**Body Field**: `image` (File object)  

#### Successful Response (`200 OK`):
```json
{
  "success": true,
  "message": "Road image uploaded successfully",
  "data": {
    "imageUrl": "https://res.cloudinary.com/...",
    "publicId": "fixmyroad/road-reports/2026/08/road_report_...",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "size": 245678
  }
}
```

#### Error Responses:
- `400 Bad Request`: File missing, oversized (>10MB), unsupported format, or invalid dimensions.
- `401 Unauthorized`: Missing or invalid JWT session.
- `403 Forbidden`: Non-citizen roles (`MUNICIPALITY_ADMIN`, `SUPER_ADMIN`).
- `429 Too Many Requests`: Upload rate limit exceeded.

---

## Cloudinary Environment Setup

To configure Cloudinary credentials for production:

1. Log into [Cloudinary Console](https://cloudinary.com).
2. Obtain **Cloud Name**, **API Key**, and **API Secret**.
3. Update `server/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Restart Express backend server.
