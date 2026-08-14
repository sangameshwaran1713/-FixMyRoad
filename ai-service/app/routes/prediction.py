from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from app.services.model_service import model_service
from app.services.image_service import process_image_bytes
from app.config import settings

router = APIRouter(tags=["Prediction"])

@router.post("/predict")
async def predict_road_damage(image: UploadFile = File(...)):
    """
    Analyzes an uploaded road damage image using Ultralytics YOLO inference.
    Returns detected bounding boxes, confidence, primary issue, and heuristic severity.
    """
    if not model_service.model_loaded:
        return JSONResponse(
            status_code=status.HTTP_531_SERVICE_UNAVAILABLE if hasattr(status, 'HTTP_531_SERVICE_UNAVAILABLE') else 503,
            content={
                "success": False,
                "modelLoaded": False,
                "modelName": model_service.model_name,
                "message": "Road damage AI model is not configured. Please place road_damage.pt in ai-service/models/ directory.",
            },
        )

    try:
        contents = await image.read()

        max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"Image size exceeds maximum limit of {settings.MAX_IMAGE_SIZE_MB} MB.",
            )

        # Process image bytes with Pillow/OpenCV
        _, img_np, width, height = process_image_bytes(contents)

        # Run YOLO model prediction
        result = model_service.predict(img_np, width, height)

        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"❌ AI Prediction Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal AI prediction error occurred.")
