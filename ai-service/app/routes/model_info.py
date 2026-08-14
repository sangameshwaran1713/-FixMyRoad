from fastapi import APIRouter
from app.services.model_service import model_service
from app.config import settings

router = APIRouter(tags=["Model Info"])

@router.get("/model-info")
async def get_model_info():
    """
    Returns model metadata, loaded YOLO class names, and active inference parameters.
    """
    return {
        "success": True,
        "modelLoaded": model_service.model_loaded,
        "modelName": model_service.model_name,
        "classes": model_service.classes,
        "confidenceThreshold": settings.CONFIDENCE_THRESHOLD,
        "iouThreshold": settings.IOU_THRESHOLD,
        "imageSize": settings.IMAGE_SIZE,
        "device": settings.DEVICE,
        "message": model_service.message,
    }
