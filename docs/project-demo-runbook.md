# FixMyRoad — Demonstration Runbook

This runbook guides users through startup procedures and outlines demo flows for the FixMyRoad platform.

---

## 1. System Startup Procedures

Execute these commands in separate terminal sessions:

### 1. MongoDB Database
Ensure a local MongoDB instance is running:
```bash
mongod --dbpath=/data/db
```

### 2. Express Backend Server
```bash
cd server
npm install
npm run dev
```
Runs on: `http://localhost:5000`

### 3. React Frontend client
```bash
cd client
npm install
npm run dev
```
Runs on: `http://localhost:5173`

### 4. FastAPI YOLO AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```
Runs on: `http://localhost:8000`

---

## 2. Walkthrough Flow

### Step 1: Citizen Sign-Up & Login
1. Go to `http://localhost:5173/register` and register as a citizen.
2. Login with the registered email and password.

### Step 2: Citizen Report Submission
1. Navigate to "Report Issue" page.
2. Select a road defect photo (pothole, crack, etc.).
3. Mark the defect location on the interactive map (Leaflet pin click).
4. Submit: The system uploads the image to Cloudinary (stripping EXIF metadata), calls the FastAPI YOLO AI model for defect type validation, performs spatial polygon lookup to route it to the correct municipality, and logs it.

### Step 3: Notification Outbox Delivery
1. The backend automatically schedules an outbox notification.
2. Check backend console logs to verify that the outbox processor claims the job and routes it.

### Step 4: Municipality Resolution Workflow
1. Login as the Municipality Administrator.
2. The dashboard shows the assigned issue.
3. Update status to `ASSIGNED` and assign an officer.
4. Update status to `RESOLVED` after repairs.

### Step 5: Citizen Quality Verification
1. Login back as the Citizen.
2. Inspect the complaint list and rate the repair.
3. If the repair is inadequate, click "Reopen Complaint" to return it to `REOPENED` status.

### Step 6: Super Admin Cockpits
1. Login as the Super Admin.
2. Navigate to **System Health Inspector** to view service statuses.
3. Go to the **Operations Dashboard** to inspect live traffic, error rates, average latency, and endpoint metrics.
4. Execute test MongoDB backup backups using the system scripts.
