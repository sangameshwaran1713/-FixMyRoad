# FixMyRoad — AI Service (FastAPI + Ultralytics YOLO)

Python microservice for computer vision road damage detection.

## Structure

```text
ai-service/
├── app/
│   ├── config.py              # AI service settings & thresholds
│   ├── main.py                # FastAPI entry point & lifespan model loader
│   ├── routes/
│   │   ├── health.py          # GET /health
│   │   ├── model_info.py      # GET /model-info
│   │   └── prediction.py      # POST /predict
│   ├── schemas/
│   │   └── prediction_schema.py
│   ├── services/
│   │   ├── model_service.py   # YOLO model singleton loader & inference
│   │   ├── image_service.py   # Pillow/OpenCV image decoding
│   │   └── severity_service.py# Prioritization heuristic engine
│   └── utils/
│       ├── normalization.py   # Class label mapping & non-road class filter
│       └── validation.py
├── models/
│   └── road_damage.pt         # Place trained YOLO weights file here
├── requirements.txt
└── README.md
```

## Running the AI Service

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Place custom trained YOLO road damage model at models/road_damage.pt
# (If no weights exist, service starts with modelLoaded = false without crashing)

# 3. Launch FastAPI server
uvicorn app.main:app --reload --port 8000
```

Check model status at `http://localhost:8000/health` and `http://localhost:8000/model-info`.
