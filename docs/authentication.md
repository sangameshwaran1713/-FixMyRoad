# FixMyRoad — Authentication & Role-Based Access Architecture

## Overview

FixMyRoad Phase 2 implements a production-grade authentication and authorization subsystem built on Node.js/Express, Mongoose (MongoDB), JSON Web Tokens (JWT), HttpOnly Cookies, and React AuthContext.

## User Roles Hierarchy

| Role | Access Level | Description |
| :--- | :--- | :--- |
| `CITIZEN` | Public Registration / Default | Standard citizen user account. Can upload damage reports, track complaint status. |
| `MUNICIPALITY_ADMIN` | Provisioned / Admin Seeded | Municipal authority officer. Can process jurisdiction tickets, dispatch repair teams. |
| `SUPER_ADMIN` | System Seeded | Platform super administrator. Oversees system health, user management, municipal boundaries. |

---

## Authentication Flow Diagram

```text
User
 ↓
Login (POST /api/auth/login)
 ↓
Express Server
 ↓
Validate credentials
 ↓
bcrypt.compare()
 ↓
Generate JWT Token
 ↓
HttpOnly Cookie (Set-Cookie)
 ↓
Authenticated Request
 ↓
authMiddleware (JWT Verify)
 ↓
roleMiddleware (authorizeRoles)
 ↓
Protected Resource Access
```

---

## Security Decisions & Tradeoffs

1. **HttpOnly Cookie Strategy**:
   - Authentication tokens are stored in `HttpOnly` cookies (`sameSite: lax`/`none`), preventing Cross-Site Scripting (XSS) attacks from accessing tokens via `document.cookie` or `localStorage`.
   - An `Authorization: Bearer <token>` fallback is also supported in `authMiddleware` for mobile/external API clients.

2. **Role Injection Prevention**:
   - Public registration (`POST /api/auth/register`) strictly sets `role: 'CITIZEN'`.
   - Any client payload attempting to inject `role: 'SUPER_ADMIN'` or `role: 'MUNICIPALITY_ADMIN'` is ignored and stripped on the backend server.

3. **Generic Error Messages**:
   - Login failures return a uniform `401 Unauthorized` message: `"Invalid email or password"`. This prevents account enumeration attacks.

4. **Password Security**:
   - Passwords are validated using real-time security rules (minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character).
   - Passwords are salted and hashed using `bcryptjs` before persisting to MongoDB.
   - User schema sets `select: false` on password fields to ensure passwords are never leaked in default queries.

---

## API Endpoints Reference

### Public Endpoints
- `POST /api/auth/register` — Registers new Citizen account.
- `POST /api/auth/login` — Authenticates user & sets HttpOnly cookie.
- `POST /api/auth/logout` — Clears authentication cookie.

### Authenticated Endpoints
- `GET /api/auth/me` — Fetches current user profile from JWT session.
- `GET /api/auth/protected-test` — Temporary verification endpoint for authenticated users.

### Role Protected Test Endpoints
- `GET /api/auth/citizen-test` — Restricted to `CITIZEN`.
- `GET /api/auth/municipality-test` — Restricted to `MUNICIPALITY_ADMIN` & `SUPER_ADMIN`.
- `GET /api/auth/admin-test` — Restricted to `SUPER_ADMIN`.

---

## Development Seed Accounts

To populate initial admin accounts for local testing, run:

```bash
cd server
npm run seed:admins
```

### Seeded Credentials:
- **SUPER_ADMIN**:
  - Email: `admin@fixmyroad.local`
  - Password: `Admin@12345`
- **MUNICIPALITY_ADMIN**:
  - Email: `municipality@fixmyroad.local`
  - Password: `Municipality@12345`
