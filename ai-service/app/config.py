import os

class Settings:
    PROJECT_NAME: str = "FixMyRoad AI Service"
    VERSION: str = "1.0.0"
    
    # Model configuration
    MODEL_PATH: str = os.getenv("MODEL_PATH", "models/road_damage.pt")
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.40"))
    IOU_THRESHOLD: float = float(os.getenv("IOU_THRESHOLD", "0.45"))
    IMAGE_SIZE: int = int(os.getenv("IMAGE_SIZE", "640"))
    DEVICE: str = os.getenv("DEVICE", "cpu")
    MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))

    # Canonical road damage enum list for mapping
    SUPPORTED_ROAD_CLASSES = [
        "POTHOLE",
        "ROAD_CRACK",
        "BROKEN_ROAD",
        "WATERLOGGING",
        "OPEN_MANHOLE",
        "DAMAGED_DIVIDER",
        "MISSING_ROAD_SIGN",
        "DAMAGED_STREET_LIGHT",
        "OTHER",
    ]

settings = Settings()
