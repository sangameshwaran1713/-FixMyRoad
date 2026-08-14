import re

ROAD_DAMAGE_MAP = {
    "pothole": "POTHOLE",
    "potholes": "POTHOLE",
    "crack": "ROAD_CRACK",
    "road_crack": "ROAD_CRACK",
    "longitudinal_crack": "ROAD_CRACK",
    "transverse_crack": "ROAD_CRACK",
    "alligator_crack": "ROAD_CRACK",
    "broken_road": "BROKEN_ROAD",
    "waterlogging": "WATERLOGGING",
    "flooding": "WATERLOGGING",
    "manhole": "OPEN_MANHOLE",
    "open_manhole": "OPEN_MANHOLE",
    "damaged_divider": "DAMAGED_DIVIDER",
    "divider": "DAMAGED_DIVIDER",
    "missing_road_sign": "MISSING_ROAD_SIGN",
    "road_sign": "MISSING_ROAD_SIGN",
    "damaged_street_light": "DAMAGED_STREET_LIGHT",
    "street_light": "DAMAGED_STREET_LIGHT",
}

NON_ROAD_CLASSES = {
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck",
    "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench",
    "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra",
    "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
    "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove",
    "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup",
    "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
    "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
    "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier",
    "toothbrush"
}

def normalize_class_name(raw_name: str):
    """
    Normalizes raw YOLO model detection labels.
    If the class is an explicit non-road object (e.g. COCO classes), returns None to prevent false detections.
    """
    cleaned = raw_name.lower().strip().replace(" ", "_")
    
    if cleaned in NON_ROAD_CLASSES or raw_name.lower() in NON_ROAD_CLASSES:
        return None  # Reject non-road damage classes

    if cleaned in ROAD_DAMAGE_MAP:
        return ROAD_DAMAGE_MAP[cleaned]

    # Check substring matches
    for key, mapped_val in ROAD_DAMAGE_MAP.items():
        if key in cleaned:
            return mapped_val

    return "OTHER"
