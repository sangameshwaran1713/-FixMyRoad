# FixMyRoad — Security Audit & Hardening Specification

## Executive Summary

FixMyRoad Phase 13 implements comprehensive enterprise security controls across authentication, role-based access control (RBAC), multi-tenant isolation, data sanitization, file upload processing, cross-site scripting (XSS), cross-site request forgery (CSRF), and server-side request forgery (SSRF) defense.

---

## 🔒 Security Architecture Matrix

### 1. Authentication & Cookie Security
- **HttpOnly JWT Cookies**: Authentication tokens are stored strictly in `HttpOnly`, `SameSite` cookies to prevent client-side JavaScript access and XSS theft.
- **Generic Auth Errors**: Login failures return generic `"Invalid email or password"` error messages to prevent user enumeration attacks.
- **Role Escalation Protection**: Public registration (`POST /api/auth/register`) enforces `role: "CITIZEN"` on all incoming payloads. Requests attempting to submit `"role": "SUPER_ADMIN"` or `"municipalityId"` are stripped and overridden.

### 2. Multi-Tenant Isolation & IDOR Protection
- **Municipal Scope Enforcement**: `MUNICIPALITY_ADMIN` and `MUNICIPALITY_OFFICER` access is strictly scoped to `req.user.municipalityId`. Query string parameters attempting cross-tenant access (e.g., `?municipalityId=MUN002`) are ignored or rejected.
- **Citizen Ownership Guard**: Citizens can only view, edit, verify, or request reopening for complaints where `complaint.citizenId === req.user._id`. Attempts to access other accounts' complaints return `403 Forbidden`.

### 3. CSRF Protection
- **Double-Submit Cookie Pattern**: Sets a readable `XSRF-TOKEN` cookie alongside the HttpOnly auth cookie. State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) require a matching `X-CSRF-Token` header.

### 4. MongoDB Operator Injection Defense
- **Query Sanitization**: All `req.query` and `req.body` parameters pass through `mongoSanitizerMiddleware`. Input keys starting with `$` (e.g. `$ne`, `$gt`, `$where`, `$or`, `$regex`) are rejected with `400 Bad Request` (`code: "INVALID_QUERY_OPERATOR"`).

### 5. File Upload & EXIF Privacy Security
- **Authoritative Binary Inspection**: Uploaded images are validated via Sharp header binary inspection.
- **Strict Format & Dimension Limits**: Only JPG, PNG, and WEBP images between 320x240 and 10000x10000 pixels are accepted.
- **EXIF Stripping**: Sharp strips hidden EXIF metadata (GPS coordinates and camera serial numbers) before uploading to Cloudinary to preserve citizen location privacy.

### 6. SSRF Security Defense
- **Trusted Cloudinary Domains**: AI microservice URL fetching validates incoming image URLs to ensure they originate strictly from trusted Cloudinary CDN domains. Requests pointing to `127.0.0.1`, `localhost`, `10.x.x.x`, `172.16.x.x`, `192.168.x.x`, or `169.254.169.254` are rejected with `maxRedirects: 0`.

### 7. CSV Formula Injection Escaping
- **Spreadsheet Formula Protection**: Exported CSV audit reports escape fields starting with `=`, `+`, `-`, `@` by prefixing with `'` to prevent formula execution in Microsoft Excel or Google Sheets.

### 8. Rate Limiting
- **Global Rate Limiting**: 300 requests per 15 minutes.
- **Analytics Rate Limiting**: 60 requests per hour (`ANALYTICS_RATE_LIMIT=60`).
- **Export Rate Limiting**: 20 report downloads per hour (`EXPORT_RATE_LIMIT=20`).
- **Health Rate Limiting**: 120 health checks per hour (`HEALTH_RATE_LIMIT=120`).
