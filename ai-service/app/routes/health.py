from fastapi import APIRouter
from app.services.model_service import model_service

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """
    Health check endpoint for the FixMyRoad AI Service.
    Exposes model status without revealing sensitive filesystem paths.
    """
    return {
        "success": True,
        "service": "FixMyRoad AI Service",
        "modelLoaded": model_service.model_loaded,
        "modelName": model_service.model_name,
        "classes": model_service.classes,
        "message": model_service.message,
    }
