# FixMyRoad — AI Road Damage Detection Architecture

## Overview

FixMyRoad Phase 6 implements an end-to-end computer vision road damage detection subsystem using **Python FastAPI**, **Ultralytics YOLO**, **OpenCV**, and a **Node.js SSRF-protected API proxy**.

---

## AI Flow Architecture

```text
React Client
   ↓
POST /api/ai/analyze (Payload: { imageUrl: "https://res.cloudinary.com/..." })
   ↓
Node.js Express Server
   ↓
authMiddleware (JWT Check) & roleMiddleware (CITIZEN authorization)
   ↓
aiRateLimiter (Rate limiting protection: 20 reqs/hr)
   ↓
SSRF Host Validation (Ensures hostname belongs strictly to allowed image hosts)
   ↓
Node downloads image bytes securely
   ↓
Forward image bytes to Python FastAPI POST /predict (http://localhost:8000/predict)
   ↓
Python FastAPI
   ↓
Ultralytics YOLO Model (Loaded in memory at startup)
   ↓
Object Detection & Class Verification
   ↓
Normalization & Non-Road Class Rejection (Ignores cars, people, animals, etc.)
   ↓
Severity Prioritization Engine (Application heuristic estimate)
   ↓
Return JSON Response to Node → React
   ↓
React renders BoundingBoxOverlay SVG canvas
```

---

## Model Setup & "No Fake AI" Enforcement

1. **Model Weights Location**:
   - Model weights must be placed at: `ai-service/models/road_damage.pt`
   - Configurable via `MODEL_PATH=models/road_damage.pt`.

2. **No Fake Detection**:
   - If `road_damage.pt` is missing or unconfigured, FastAPI initializes with `modelLoaded: false`.
   - Prediction requests return `503 Service Unavailable` with `modelLoaded: false`.
   - The system NEVER returns dummy or fake random detections when model weights are missing.

3. **Class Verification & Non-Road Filtering**:
   - `normalization.py` verifies model class labels.
   - Known road damage labels (e.g. `pothole`, `crack`, `manhole`, `waterlogging`) are mapped to canonical enums (`POTHOLE`, `ROAD_CRACK`, `OPEN_MANHOLE`, `WATERLOGGING`).
   - Standard COCO non-road labels (`person`, `car`, `bus`, `dog`, `chair`, etc.) are explicitly rejected to prevent falsely classifying unrelated objects as road damage.

---

## Severity Prioritization Engine

> [!NOTE]
> Severity scores (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) are application-level priority estimates computed from detection confidence, class severity weights, and bounding box relative image coverage area—not formal municipal engineering assessments.

### Priority Rules:
- **CRITICAL**: `OPEN_MANHOLE`, `DAMAGED_DIVIDER`, or `WATERLOGGING` with confidence ≥ 0.70 OR bounding box image coverage ≥ 25% OR total detections ≥ 5.
- **HIGH**: `POTHOLE` or `BROKEN_ROAD` with confidence ≥ 0.60 OR image coverage ≥ 12% OR total detections ≥ 3.
- **MEDIUM**: Any valid detection with confidence ≥ 0.50 OR image coverage ≥ 5% OR total detections ≥ 2.
- **LOW**: Default for low-confidence or small area detections.

---

## Security & SSRF Protection

1. **SSRF Host Validation**:
   - Node backend validates `imageUrl` hostnames before fetching bytes.
   - Strictly blocks private IP ranges (`127.0.0.1`, `localhost`, `169.254.x.x`, `10.x.x.x`, `192.168.x.x`, `file://`).
   - Accepts only permitted public image hosts (`res.cloudinary.com`, `images.unsplash.com`).

2. **Rate Limiting**:
   - `/api/ai/analyze` is protected by `aiRateLimiter` (`AI_RATE_LIMIT=20` per hour).

---

## API Endpoints Reference

### FastAPI Endpoints (`http://localhost:8000`)
- `GET /health` — Service & model loading status (`modelLoaded`, `modelName`, `classes`).
- `GET /model-info` — Loaded YOLO model metadata, classes, device (`cpu`), and thresholds (`conf: 0.40`, `iou: 0.45`, `imgsz: 640`).
- `POST /predict` — Accepts `multipart/form-data` with `image` file field. Returns JSON predictions & bounding boxes.

### Express API Endpoint (`http://localhost:5000`)
- `POST /api/ai/analyze` — Authenticated Citizen route accepting `{ "imageUrl": "..." }`.

---

## Setup Instructions for Testing with Real Model Weights

1. Place a trained PyTorch YOLO model at `ai-service/models/road_damage.pt` (or configure `MODEL_PATH`).
2. Start FastAPI AI service:
   ```bash
   cd ai-service
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
3. Test health status: `http://localhost:8000/health`.
