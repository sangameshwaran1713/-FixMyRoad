# FixMyRoad — Disaster Recovery (DR) Plan

## Recovery Objectives (SLAs)

- **Recovery Point Objective (RPO)**: 24 Hours (Maximum database transaction loss window).
- **Recovery Time Objective (RTO)**: 2 Hours (Target service recovery duration for primary components).

---

## 💾 Database Backup & Safe Restore Procedures

### 1. Database Backup (mongodump)
Database backups are scheduled daily via a background cron process:
```bash
node src/scripts/backup-mongodb.js
```
Backups are saved to the configured `BACKUP_DIR` with a retention policy of 30 days (`BACKUP_RETENTION_DAYS=30`).

### 2. Database Restore (mongorestore)
To prevent accidental destructive database overwrites, the restore process is heavily guarded. Executing the restore tool requires setting an explicit confirmation environment flag:

```bash
CONFIRM_RESTORE=true node src/scripts/restore-mongodb.js
```
The script locates the latest backup dump folder in `BACKUP_DIR`, runs `mongorestore --drop`, and performs database collection integrity checks across all 9 required schemas.

---

## 🚨 System Outage Resolution Guidelines

### 1. FastAPI AI Service Outage
- **Indication**: `/api/admin/health/system` reports `FastAPI AI Microservice = OFFLINE`.
- **Policy**: Node Express server falls back to server-side severity heuristics cleanly without throwing internal exceptions. Citizens can continue submitting complaints.
- **Resolution**: Restart AI service container:
  ```bash
  docker compose -f docker-compose.production.yml restart ai-service
  ```

### 2. Cloudinary Outage
- **Indication**: Image uploads fail with a controlled gateway timeout.
- **Policy**: Server rejects complaint creation safely, returning a clean UI error message without creating incomplete database records.
- **Resolution**: Check Cloudinary system status page. If credentials changed, update the production `.env` and restart:
  ```bash
  docker compose -f docker-compose.production.yml restart server
  ```

### 3. Nominatim Geocoding Outage
- **Indication**: Location reverse geocoding queries timeout or return 500 status.
- **Policy**: Server continues processing complaint mapping without crashing.
- **Resolution**: Check external OSM gateway status.

### 4. Background Outbox Worker Crash
- **Indication**: Notifications state remains locked in `PENDING` or `PROCESSING`.
- **Policy**: Startup checks clear old `PROCESSING` jobs.
- **Resolution**: Restart server container.
