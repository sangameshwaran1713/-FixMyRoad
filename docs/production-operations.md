# FixMyRoad — Production Operations Runbook

## 🚀 Application Lifecycle Operations

### 1. Server Startup
During server startup, Node validates all required environment variables (`validateProductionConfig`) and pings MongoDB. If critical variables are missing or MongoDB is offline, the server fails safely, printing only missing names (no secrets).

### 2. Graceful Shutdown
Express registers listeners for `SIGTERM` and `SIGINT` signals:
1. Stops accepting incoming requests.
2. Stops the background outbox poller cleanly.
3. Automatically releases active `PROCESSING` outbox locks back to `RETRYING`.
4. Closes database connections.
5. Shuts down the HTTP server process cleanly.

---

## 🛠️ Deployment Runbook

### Pre-Deployment Verification
Run pre-deployment checks before release:
```bash
node src/scripts/pre-deployment-check.js
```

### Rollback Runbook
If a deployment fails post-release:
1. Stop the current docker container build.
2. Revert to the stable image version.
3. Verify MongoDB schema backward compatibility.
4. Execute live post-deployment sanity checks:
   ```bash
   node src/scripts/post-deployment-check.js
   ```

---

## 📊 Observability & Monitoring

Real-time infrastructure stats are accessed on the Super Admin **Operations Dashboard**:
- **Log Format**: JSON structured logs.
- **Privacy Policy**: Password, auth cookies, tokens, and location details are masked in all logs.
- **Log Rotation**: Configure Docker `json-file` log-driver size limit to `10m` to prevent storage exhaust:
  ```yaml
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
  ```
