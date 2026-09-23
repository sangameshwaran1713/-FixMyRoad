from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.health import router as health_router
from app.routes.model_info import router as model_info_router
from app.routes.prediction import router as prediction_router
from app.services.model_service import model_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load YOLO model into memory ONCE during application startup
    model_service.load_model()
    yield
    print("[AI Service] FixMyRoad AI Service shutting down...")

app = FastAPI(
    title="FixMyRoad AI Service",
    description="Microservice for road damage computer vision detection using Ultralytics YOLO & FastAPI",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health_router)
app.include_router(model_info_router)
app.include_router(prediction_router)

@app.get("/")
async def root():
    return {
        "success": True,
        "message": "FixMyRoad AI Microservice API",
        "health": "/health",
        "modelInfo": "/model-info",
        "predict": "/predict",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
