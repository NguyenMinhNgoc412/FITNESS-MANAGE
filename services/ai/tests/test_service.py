import os
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {"AI_SERVICE_TOKEN": "unit-test-only"})
        self.env.start()
        self.client = TestClient(app)
        self.headers = {"X-Service-Token": "unit-test-only"}
        self.valid = {
            "schemaVersion": "1.0", "exercise": "SQUAT", "status": "COMPLETED",
            "reps": 2, "metrics": {"minKneeAngle": 95, "detectedRatio": 0.9},
            "issues": [{"code": "INSUFFICIENT_DEPTH", "confidence": 0.8}],
        }

    def tearDown(self):
        self.client.close()
        self.env.stop()

    def test_requires_gateway_auth(self):
        self.assertEqual(self.client.post("/ai/form-analysis", json=self.valid).status_code, 401)

    def test_only_form_feedback(self):
        response = self.client.post("/ai/form-analysis", headers=self.headers, json=self.valid)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.json()), {"schemaVersion", "status", "feedback"})

    def test_rejects_media_at_any_schema_level(self):
        for key in ["video", "base64", "mediaUrl", "thumbnail", "memberId"]:
            with self.subTest(field=key):
                response = self.client.post("/ai/form-analysis", headers=self.headers, json={**self.valid, key: "forbidden"})
                self.assertEqual(response.status_code, 422)
                self.assertNotIn("forbidden", response.text)
        value = {**self.valid, "metrics": {**self.valid["metrics"], "video": "forbidden"}}
        self.assertEqual(self.client.post("/ai/form-analysis", headers=self.headers, json=value).status_code, 422)

    def test_old_video_and_plan_routes_removed(self):
        for path in ["/v1/analyze/pose", "/v1/generate/plan"]:
            self.assertEqual(self.client.post(path, headers=self.headers, json={}).status_code, 404)

    def test_failure_does_not_invent_issues(self):
        value = {**self.valid, "status": "POSE_NOT_DETECTED", "reps": 0, "issues": []}
        result = self.client.post("/ai/form-analysis", headers=self.headers, json=value)
        self.assertEqual(result.json()["status"], "POSE_NOT_DETECTED")
        value["issues"] = self.valid["issues"]
        self.assertEqual(self.client.post("/ai/form-analysis", headers=self.headers, json=value).status_code, 422)

    def test_rejects_unsupported_exercise_and_bad_confidence(self):
        for value in [{**self.valid, "exercise": "BENCH_PRESS"}, {**self.valid, "metrics": {"minKneeAngle": 90, "detectedRatio": 0.2}}]:
            self.assertEqual(self.client.post("/ai/form-analysis", headers=self.headers, json=value).status_code, 422)

    def test_rejects_non_json_and_large_body(self):
        self.assertEqual(self.client.post("/ai/form-analysis", content=b"video", headers={"Content-Type": "video/mp4"}).status_code, 415)
        self.assertEqual(self.client.post("/ai/form-analysis", content=b"x" * 9000, headers={"Content-Type": "application/json"}).status_code, 413)
