import json
import os
import shutil
import tempfile
import unittest
from unittest.mock import Mock, patch

import cv2
import numpy as np
from fastapi.testclient import TestClient

from app.analyzer import _angle, analyze_video
from app.generation import generate_plan
from app.main import app
from app.models import InputQuality, PlanPayload, PoseData, StructuredPoseResult


def structured_result(status: str = "VALID") -> StructuredPoseResult:
    return StructuredPoseResult(
        schemaVersion="1.0.0",
        inputQuality=InputQuality(status=status, reasons=[]),
        pose=PoseData(
            features={"sampledFrames": 10, "detectedFrames": 8},
            keypoints=[{"frame": 0, "averageVisibility": 0.9}],
            derivedMetrics={"poseDetectionRatio": 0.8},
        ),
        confidence={"poseDetectionRatio": 0.8},
        warnings=[],
        analyzerVersion="test-analyzer",
    )


class ServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["AI_SERVICE_TOKEN"] = "test-token"

    def test_health_and_internal_auth(self) -> None:
        client = TestClient(app)
        self.assertEqual(client.get("/health").json(), {"status": "ok"})
        response = client.post(
            "/v1/analyze/pose",
            json={"mediaUrl": "https://example.test/video.mp4", "correlationId": "test"},
        )
        self.assertEqual(response.status_code, 401)

    def test_pose_angle_uses_three_landmarks(self) -> None:
        a = Mock(x=0.0, y=0.0); b = Mock(x=0.0, y=1.0); c = Mock(x=1.0, y=1.0)
        self.assertEqual(_angle(a, b, c), 90.0)

    def test_generation_rejects_invalid_cv_result_before_llm(self) -> None:
        with patch("app.generation.OpenAI") as openai:
            with self.assertRaisesRegex(ValueError, "not valid"):
                generate_plan(structured_result("NEEDS_RETAKE"), "Tăng sức bền")
            openai.assert_not_called()

    def test_generation_sends_only_structured_result_and_disables_storage(self) -> None:
        os.environ["OPENAI_API_KEY"] = "test-key"
        os.environ["OPENAI_MODEL"] = "test-openai-model"
        payload = {
            "summary": "Kế hoạch thử nghiệm",
            "focusAreas": ["Sức bền"],
            "recommendations": ["Tập đều"],
            "trainingPlan": {
                "phases": [
                    {
                        "name": "Nền tảng",
                        "durationWeeks": 2,
                        "goals": ["Ổn định"],
                        "exercises": ["Squat"],
                    }
                ]
            },
            "limitations": ["Dữ liệu thử nghiệm"],
            "safetyFlags": [],
        }
        response = Mock()
        response.choices = [Mock(message=Mock(content=json.dumps(payload, ensure_ascii=False)))]
        client = Mock()
        client.chat.completions.create.return_value = response
        with patch("app.generation.OpenAI", return_value=client) as openai:
            result = generate_plan(structured_result(), "Tăng sức bền")

        openai.assert_called_once_with(api_key="test-key")
        call = client.chat.completions.create.call_args.kwargs
        sent = json.loads(call["messages"][1]["content"])
        self.assertEqual(call["model"], "test-openai-model")
        self.assertEqual(set(sent), {"structuredResult", "memberGoal"})
        self.assertNotIn("mediaUrl", call["messages"][1]["content"])
        self.assertEqual(call["response_format"], {"type": "json_object"})
        self.assertEqual(result.modelVersion, "test-openai-model")
        client.close.assert_called_once()

    def test_pose_pipeline_reads_video_and_returns_retake(self) -> None:
        os.environ["POSE_MIN_DETECTED_RATIO"] = "0.5"
        os.environ["POSE_MIN_BRIGHTNESS"] = "10"
        os.environ["POSE_MIN_SAMPLED_FRAMES"] = "3"
        with tempfile.TemporaryDirectory() as directory:
            video_path = os.path.join(directory, "blank.avi")
            writer = cv2.VideoWriter(
                video_path,
                cv2.VideoWriter_fourcc(*"MJPG"),
                10.0,
                (320, 240),
            )
            self.assertTrue(writer.isOpened())
            for _ in range(10):
                writer.write(np.full((240, 320, 3), 200, dtype=np.uint8))
            writer.release()

            def copy_video(_url: str, destination: str) -> None:
                shutil.copyfile(video_path, destination)

            with patch("app.analyzer._download", side_effect=copy_video):
                result = analyze_video("https://example.test/blank.avi")

        self.assertEqual(result.inputQuality.status, "NEEDS_RETAKE")
        self.assertIn("POSE_NOT_VISIBLE_ENOUGH", result.inputQuality.reasons)
        self.assertGreaterEqual(result.pose.features["sampledFrames"], 3)


if __name__ == "__main__":
    unittest.main()
