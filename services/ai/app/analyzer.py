import os
import math
import tempfile
import urllib.request
from urllib.parse import urlparse
import cv2
import mediapipe as mp
from .models import InputQuality, PoseData, StructuredPoseResult

SCHEMA_VERSION = "1.0.0"
ANALYZER_VERSION = "opencv-mediapipe-pose-1.1.0"

def _angle(a, b, c) -> float:
    first = math.atan2(c.y - b.y, c.x - b.x)
    second = math.atan2(a.y - b.y, a.x - b.x)
    return round(abs(math.degrees(first - second)) % 360 if abs(math.degrees(first - second)) % 360 <= 180 else 360 - abs(math.degrees(first - second)) % 360, 2)

def _mean(values: list[float]) -> float:
    return round(sum(values) / len(values), 4) if values else 0.0

def _required_float(name: str) -> float:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required quality threshold: {name}")
    return float(value)

def _download(media_url: str, destination: str) -> None:
    parsed = urlparse(media_url)
    allow_http = os.environ.get("AI_ALLOW_HTTP_MEDIA", "false").lower() == "true"
    if parsed.scheme != "https" and not (allow_http and parsed.scheme == "http"):
        raise ValueError("Media URL must use HTTPS")
    with urllib.request.urlopen(media_url, timeout=30) as response, open(destination, "wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)

def analyze_video(media_url: str) -> StructuredPoseResult:
    min_ratio = _required_float("POSE_MIN_DETECTED_RATIO")
    min_brightness = _required_float("POSE_MIN_BRIGHTNESS")
    min_frames = int(_required_float("POSE_MIN_SAMPLED_FRAMES"))
    suffix = os.path.splitext(urlparse(media_url).path)[1] or ".mp4"
    with tempfile.TemporaryDirectory() as directory:
        media_path = os.path.join(directory, f"input{suffix}")
        _download(media_url, media_path)
        sampled = detected = 0
        brightness_total = visibility_total = 0.0
        aggregate: list[dict[str, float | int]] = []
        metrics: dict[str, list[float]] = {"shoulderTilt": [], "hipTilt": [], "leftKneeAngle": [], "rightKneeAngle": [], "leftElbowAngle": [], "rightElbowAngle": [], "centerOffset": []}
        pose = mp.solutions.pose.Pose(static_image_mode=False, model_complexity=1)
        capture = cv2.VideoCapture(media_path)
        try:
            frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
            sample_every = max(frame_count // 30, 1)
            index = 0
            while capture.isOpened():
                ok, frame = capture.read()
                if not ok:
                    break
                if index % sample_every == 0:
                    sampled += 1
                    brightness_total += float(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).mean())
                    result = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                    if result.pose_landmarks:
                        detected += 1
                        landmarks = result.pose_landmarks.landmark
                        visible = [point.visibility for point in landmarks]
                        visibility_total += sum(visible) / len(visible)
                        left_shoulder, right_shoulder = landmarks[11], landmarks[12]
                        left_hip, right_hip = landmarks[23], landmarks[24]
                        frame_metrics = {
                            "shoulderTilt": round(math.degrees(math.atan2(right_shoulder.y - left_shoulder.y, right_shoulder.x - left_shoulder.x)), 2),
                            "hipTilt": round(math.degrees(math.atan2(right_hip.y - left_hip.y, right_hip.x - left_hip.x)), 2),
                            "leftKneeAngle": _angle(left_hip, landmarks[25], landmarks[27]), "rightKneeAngle": _angle(right_hip, landmarks[26], landmarks[28]),
                            "leftElbowAngle": _angle(left_shoulder, landmarks[13], landmarks[15]), "rightElbowAngle": _angle(right_shoulder, landmarks[14], landmarks[16]),
                            "centerOffset": round(((left_shoulder.x + right_shoulder.x + left_hip.x + right_hip.x) / 4) - 0.5, 4),
                        }
                        for name, value in frame_metrics.items(): metrics[name].append(value)
                        aggregate.append({"frame": index, "averageVisibility": round(sum(visible) / len(visible), 4), **frame_metrics})
                index += 1
        finally:
            capture.release()
            pose.close()
    ratio = detected / sampled if sampled else 0.0
    brightness = brightness_total / sampled if sampled else 0.0
    reasons: list[str] = []
    if sampled < min_frames: reasons.append("TOO_FEW_USABLE_FRAMES")
    if brightness < min_brightness: reasons.append("VIDEO_TOO_DARK")
    if ratio < min_ratio: reasons.append("POSE_NOT_VISIBLE_ENOUGH")
    quality = "VALID" if not reasons else "NEEDS_RETAKE"
    return StructuredPoseResult(
        schemaVersion=SCHEMA_VERSION,
        inputQuality=InputQuality(status=quality, reasons=reasons),
        pose=PoseData(features={"sampledFrames": sampled, "detectedFrames": detected}, keypoints=aggregate, derivedMetrics={"poseDetectionRatio": round(ratio, 4), "averageBrightness": round(brightness, 2), **{f"average{name[0].upper()}{name[1:]}": _mean(values) for name, values in metrics.items()}}),
        confidence={"poseDetectionRatio": round(ratio, 4), "averageVisibility": round(visibility_total / detected, 4) if detected else 0.0},
        warnings=[] if quality == "VALID" else ["Input quality is insufficient; no training plan should be generated."],
        analyzerVersion=ANALYZER_VERSION,
    )
