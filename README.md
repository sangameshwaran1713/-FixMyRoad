# FixMyRoad — AI-Powered Road Damage Reporting Platform

FixMyRoad is an enterprise AI-powered road damage reporting and municipal routing platform designed to streamline civic infrastructure maintenance. Citizens can snap a photo of damaged roads, which is analyzed by computer vision models to classify damage, extract GPS coordinates, route the issue to the appropriate municipal jurisdiction, track resolution progress transparently, verify repair quality, and analyze civic metrics.

---

## 📌 Project Objective

The objective of FixMyRoad is to eliminate administrative delays in civic road repair by automating damage detection, location mapping, municipality routing, and resolution verification using modern web technologies, spatial GeoJSON algorithms, and computer vision models.

---

## 🏗️ Architecture

```text
                 FixMyRoad
                     │
          ┌──────────┴──────────┐
          │                     │
       React                Node.js
       Client               Express
          │                     │
          │                     ├── Operations & Observability Cockpit
          │                     │     (Graceful Shutdown, metricsService, Backup & Restore)
          │                     │
          │                     ├── Security & Hardening (RequestId, Helmet, CSRF, Logger, Sanitize)
          │                     ├── Health & Readiness (/api/health/live, /api/health/ready)
          │                     ├── Analytics & System Health Subsystem
          │                     ├── Citizen Verification & Reopen Subsystem
          │                     ├── Municipality Admin Dashboard & Workflow
          │                     ├── Asynchronous Outbox Notification Subsystem
          │                     ├── GeoJSON 2dsphere Spatial Routing
          │                     ├── Multer / Sharp / Cloudinary EXIF Privacy
          │                     ├── MongoDB (Mongoose Schema Architecture)
          │                     └── Python AI (FastAPI + Ultralytics YOLO)
          │                            │
          │                         FastAPI
          │                            │
          │                           YOLO
          │
       GPS / Maps
```

---

## 📖 Project Documentation & Operations Manuals

Complete manuals are available under the `/docs` directory:
1. **Academic Submission Handbook**: [academic-submission-handbook.md](file:///c:/Users/messy/OneDrive/Pictures/Documents/Custom%20Office%20Templates/OneDrive/Attachments/Sem%207%20project/docs/academic-submission-handbook.md) — System overview, schema models, API catalog, and security mechanisms.
2. **Demonstration Runbook**: [project-demo-runbook.md](file:///c:/Users/messy/OneDrive/Pictures/Documents/Custom%20Office%20Templates/OneDrive/Attachments/Sem%207%20project/docs/project-demo-runbook.md) — Setup commands and user workflow test steps.
3. **Disaster Recovery (DR) Plan**: [disaster-recovery.md](file:///c:/Users/messy/OneDrive/Pictures/Documents/Custom%20Office%20Templates/OneDrive/Attachments/Sem%207%20project/docs/disaster-recovery.md) — RPO/RTO metrics and database backup & restore.
4. **Production Operations Runbook**: [production-operations.md](file:///c:/Users/messy/OneDrive/Pictures/Documents/Custom%20Office%20Templates/OneDrive/Attachments/Sem%207%20project/docs/production-operations.md) — Express server signal shutdown, logs, and deployment steps.
5. **Security & Hardening Specification**: [security-audit.md](file:///c:/Users/messy/OneDrive/Pictures/Documents/Custom%20Office%20Templates/OneDrive/Attachments/Sem%207%20project/docs/security-audit.md) — Double-submit CSRF, rate limiters, and EXIF sanitization.
6. **Testing & Verification Matrix**: [testing.md](file:///c:/Users/messy/OneDrive/Pictures/Documents/Custom%20Office%20Templates/OneDrive/Attachments/Sem%207%20project/docs/testing.md) — Automated script commands and validation status check.
7. **Analytics & Reporting Subsystem**: [analytics-and-reporting.md](file:///c:/Users/messy/OneDrive/Pictures/Documents/Custom%20Office%20Templates/OneDrive/Attachments/Sem%207%20project/docs/analytics-and-reporting.md) — DB aggregations and CSV formula protection.

---

## 🚀 Technology Stack

- **Frontend**: React.js, Vite, JavaScript, Tailwind CSS, Leaflet, React Leaflet, React Router DOM, Axios, Lucide React
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, Nodemailer, Multer, Sharp, Cloudinary SDK, Axios, bcryptjs, jsonwebtoken, cookie-parser, Cors, Helmet, Rate Limiter
- **AI Service**: Python, FastAPI, Uvicorn, Ultralytics YOLO, OpenCV, Pillow, PyTorch, NumPy, Pydantic
- **Infrastructure / Ops**: Docker Compose, Nginx, Git
