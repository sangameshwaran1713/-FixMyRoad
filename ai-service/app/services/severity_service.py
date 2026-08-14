def calculate_severity(detections: list, image_width: int, image_height: int) -> str:
    """
    Application-level prioritization heuristic for estimating defect severity.
    NOTE: This calculation is a deterministic application heuristic based on detection confidence,
    class priority, and bounding box image coverage area—not a formal municipal engineering assessment.
    
    Returns: LOW | MEDIUM | HIGH | CRITICAL
    """
    if not detections or image_width <= 0 or image_height <= 0:
        return "LOW"

    image_area = image_width * image_height
    max_coverage = 0.0
    highest_confidence = 0.0
    has_critical_class = False
    has_high_class = False

    critical_classes = {"OPEN_MANHOLE", "DAMAGED_DIVIDER", "WATERLOGGING"}
    high_classes = {"POTHOLE", "BROKEN_ROAD"}

    for det in detections:
        conf = det.get("confidence", 0.0)
        cls = det.get("class", "")
        box = det.get("boundingBox", {})

        if conf > highest_confidence:
            highest_confidence = conf

        if cls in critical_classes:
            has_critical_class = True
        elif cls in high_classes:
            has_high_class = True

        x1 = box.get("x1", 0)
        y1 = box.get("y1", 0)
        x2 = box.get("x2", 0)
        y2 = box.get("y2", 0)

        box_area = max(0, x2 - x1) * max(0, y2 - y1)
        coverage = box_area / image_area
        if coverage > max_coverage:
            max_coverage = coverage

    total_detections = len(detections)

    # Heuristic scoring logic
    if (has_critical_class and highest_confidence >= 0.7) or (max_coverage >= 0.25 and highest_confidence >= 0.8) or total_detections >= 5:
        return "CRITICAL"

    if (has_high_class and highest_confidence >= 0.6) or (max_coverage >= 0.12) or (total_detections >= 3):
        return "HIGH"

    if highest_confidence >= 0.5 or max_coverage >= 0.05 or total_detections >= 2:
        return "MEDIUM"

    return "LOW"
