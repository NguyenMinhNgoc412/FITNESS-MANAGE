"""Generate non-personal video for the local AI failure-state E2E."""
import sys
import cv2
import numpy as np
writer = cv2.VideoWriter(sys.argv[1], cv2.VideoWriter_fourcc(*"VP80"), 10, (320, 240))
if not writer.isOpened():
    raise SystemExit("Cannot create generated video fixture")
for _ in range(20):
    writer.write(np.zeros((240, 320, 3), dtype=np.uint8))
writer.release()
