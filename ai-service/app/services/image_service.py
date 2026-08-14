import io
import numpy as np
from PIL import Image
import cv2

def process_image_bytes(file_bytes: bytes):
    """
    Decodes image bytes using Pillow/OpenCV and returns PIL Image and NumPy RGB array.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("Image file payload is empty.")

    try:
        pil_image = Image.open(io.BytesIO(file_bytes))
        pil_image.verify()  # Verify format integrity
        
        # Reopen since verify() modifies stream position
        pil_image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        img_np = np.array(pil_image)

        width, height = pil_image.size
        if width < 32 or height < 32:
            raise ValueError("Image dimensions are too small for AI inference.")

        return pil_image, img_np, width, height
    except Exception as e:
        raise ValueError(f"Failed to decode or parse image: {str(e)}")
