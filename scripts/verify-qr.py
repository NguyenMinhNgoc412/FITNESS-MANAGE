"""Independent QR round-trip using OpenCV, with generated non-user payloads."""
import json
import sys
import cv2
import numpy as np

cases = json.load(sys.stdin)
for case in cases:
    pixels = np.where(np.array(case["matrix"]), 0, 255).astype(np.uint8)
    pixels = np.pad(pixels, 4, constant_values=255)
    pixels = np.repeat(np.repeat(pixels, 8, axis=0), 8, axis=1)
    decoded, points, _ = cv2.QRCodeDetectorAruco().detectAndDecode(pixels)
    if points is None or decoded != case["value"]:
        raise SystemExit(f"QR round-trip failed at payload length {len(case['value'])}; detected={points is not None}")
print(f"QR round-trip: {len(cases)} payload sizes decoded successfully")
