from pydantic import BaseModel, Field
from typing import List, Optional

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int

class Detection(BaseModel):
    class_name: str = Field(..., serialization_alias="class")
    confidence: float
    boundingBox: BoundingBox

class PredictionResponse(BaseModel):
    success: bool
    modelLoaded: bool
    modelName: str
    detections: List[Detection] = []
    primaryIssue: Optional[str] = None
    overallConfidence: float = 0.0
    severity: str = "LOW"
    message: Optional[str] = None
