import os
from ultralytics import YOLO
from app.config import settings
from app.utils.normalization import normalize_class_name
from app.services.severity_service import calculate_severity

class ModelService:
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.model_name = os.path.basename(settings.MODEL_PATH)
        self.classes = []
        self.message = "AI Model not initialized"

    def load_model(self):
        """
        Loads the YOLO model into memory once during FastAPI startup.
        """
        model_path = settings.MODEL_PATH

        if not os.path.exists(model_path):
            self.model_loaded = False
            self.message = f"Road damage model file not found at '{model_path}'. Please configure weights."
            print(f"⚠️  AI SERVICE NOTICE: {self.message}")
            return False

        try:
            print(f"🚀 Loading YOLO model from '{model_path}' on device '{settings.DEVICE}'...")
            self.model = YOLO(model_path)
            self.model_loaded = True
            
            # Extract dynamically loaded class names from YOLO model weights
            if hasattr(self.model, 'names') and self.model.names:
                if isinstance(self.model.names, dict):
                    self.classes = list(self.model.names.values())
                else:
                    self.classes = list(self.model.names)
            else:
                self.classes = []

            self.message = "Road damage model loaded successfully"
            print(f"✅ AI MODEL LOADED SUCCESSFULLY. Configured Classes ({len(self.classes)}): {self.classes}")
            return True
        except Exception as e:
            self.model_loaded = False
            self.message = f"Failed to load YOLO model: {str(e)}"
            print(f"❌  AI SERVICE ERROR: {self.message}")
            return False

    def predict(self, img_np, image_width: int, image_height: int):
        if not self.model_loaded or self.model is None:
            raise ValueError(
                "Road damage AI model is not configured. Please place road_damage.pt in ai-service/models/ directory."
            )

        # Execute Ultralytics YOLO inference
        results = self.model(
            img_np,
            conf=settings.CONFIDENCE_THRESHOLD,
            iou=settings.IOU_THRESHOLD,
            imgsz=settings.IMAGE_SIZE,
            device=settings.DEVICE,
            verbose=False,
        )

        detections = []
        highest_conf = 0.0
        primary_issue = None

        if results and len(results) > 0:
            boxes = results[0].boxes
            for box in boxes:
                cls_id = int(box.cls[0].item())
                raw_label = self.model.names[cls_id] if self.model.names and cls_id in self.model.names else str(cls_id)
                confidence = round(float(box.conf[0].item()), 4)

                # Normalize class name and reject non-road classes
                normalized_class = normalize_class_name(raw_label)
                if normalized_class is None:
                    continue # Ignore non-road damage objects (cars, people, animals, etc.)

                xyxy = box.xyxy[0].tolist()
                b_box = {
                    "x1": int(xyxy[0]),
                    "y1": int(xyxy[1]),
                    "x2": int(xyxy[2]),
                    "y2": int(xyxy[3]),
                }

                detection_item = {
                    "class": normalized_class,
                    "confidence": confidence,
                    "boundingBox": b_box,
                }
                detections.append(detection_item)

                if confidence > highest_conf:
                    highest_conf = confidence
                    primary_issue = normalized_class

        # Calculate heuristic severity prioritization
        severity = calculate_severity(detections, image_width, image_height)

        return {
            "success": True,
            "modelLoaded": True,
            "modelName": self.model_name,
            "detections": detections,
            "primaryIssue": primary_issue,
            "overallConfidence": highest_conf,
            "severity": severity,
            "message": "Detection completed" if detections else "No supported road damage detected",
        }

model_service = ModelService()
