import json
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.feedback import automatic_feedback, evidence_rows, CoachRewrite
from app.models import AutoFormRequest


def fixture():
    return {"schemaVersion": "2.0", "exercise": "SQUAT", "status": "COMPLETED", "recognitionScore": 0.9, "reps": 1,
            "metrics": {"detectedRatio": 0.9, "minJointAngle": 115}, "reference": {"trunkMax": 20},
            "perRep": [{"index": 1, "timeSeconds": 1.2, "angles": {"kneeLeft": 115, "kneeRight": 90, "trunk": 30,
                        "elbowLeft": 170, "elbowRight": None, "armLeft": 10, "armRight": None}, "bodyLine": None}]}


class AutomaticTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {"AI_SERVICE_TOKEN": "unit-test-only", "OPENAI_API_KEY": "", "OPENAI_MODEL": ""})
        self.env.start()
        self.client = TestClient(app)
        self.headers = {"X-Service-Token": "unit-test-only"}

    def tearDown(self):
        self.client.close()
        self.env.stop()

    def test_measured_local_feedback_and_targets(self):
        response = self.client.post('/ai/form-analysis', headers=self.headers, json=fixture())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['provider'], 'LOCAL')
        self.assertIn('115°; mục tiêu app ≤100°', ' '.join(data['feedback']))
        self.assertIn('30°; mục tiêu app ≤20°', ' '.join(data['feedback']))
        self.assertIn('chưa có mục tiêu', ' '.join(data['feedback']))

    def test_all_exercises_and_unknown_no_ai_call(self):
        for exercise in ['SQUAT', 'PUSH_UP', 'LUNGE']:
            value = fixture(); value['exercise'] = exercise
            self.assertEqual(self.client.post('/ai/form-analysis', headers=self.headers, json=value).status_code, 200)
        value = fixture(); value.update(exercise='UNKNOWN', status='UNRECOGNIZED_EXERCISE', reps=0, perRep=[])
        with patch('app.feedback.OpenAI') as sdk:
            response = self.client.post('/ai/form-analysis', headers=self.headers, json=value)
            self.assertEqual(response.status_code, 200); sdk.assert_not_called()
            self.assertNotIn('Squat', ' '.join(response.json()['feedback']))

    def test_rejects_raw_media_identity_and_missing_evidence(self):
        for key in ['video', 'base64', 'landmarks', 'memberId']:
            value = fixture(); value['perRep'][0]['angles'][key] = 'forbidden'
            response = self.client.post('/ai/form-analysis', headers=self.headers, json=value)
            self.assertEqual(response.status_code, 422); self.assertNotIn('forbidden', response.text)
        for changes in [dict(exercise='UNKNOWN'), dict(perRep=[]), dict(recognitionScore=0.4), dict(reps=2)]:
            self.assertEqual(self.client.post('/ai/form-analysis', headers=self.headers, json=fixture() | changes).status_code, 422)
        self.assertEqual(self.client.post('/ai/form-analysis', json=fixture()).status_code, 401)

    def test_openai_uses_configured_model_and_json_only_without_response_storage(self):
        request = AutoFormRequest.model_validate(fixture())
        rows = evidence_rows(request)
        rewrite = CoachRewrite.model_validate({'entries': [{'index': row['index'], 'metric': row['metric'], 'explanation': 'Đối chiếu theo tiêu chí đang xét.', 'cue': 'Di chuyển chậm và giữ ổn định.'} for row in rows]})
        sdk = MagicMock(); sdk.responses.parse.return_value = SimpleNamespace(output_parsed=rewrite)
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'unit-test-only', 'OPENAI_MODEL': 'configured-model'}), patch('app.feedback.OpenAI') as factory:
            factory.return_value.__enter__.return_value = sdk
            response = automatic_feedback(request)
        self.assertEqual(response.provider, 'OPENAI')
        args = sdk.responses.parse.call_args.kwargs
        self.assertEqual(args['model'], 'configured-model'); self.assertFalse(args['store'])
        payload = json.loads(args['input'][1]['content'])
        self.assertEqual(payload['rows'], rows)
        self.assertNotIn('video', args['input'][1]['content'])
        self.assertIn('115°', ' '.join(response.feedback))

    def test_refusal_timeout_and_invented_numbers_keep_local_results(self):
        request = AutoFormRequest.model_validate(fixture())
        rows = evidence_rows(request)
        bad = CoachRewrite.model_validate({'entries': [{'index': row['index'], 'metric': row['metric'], 'explanation': 'Góc 45 độ.', 'cue': ''} for row in rows]})
        for output in [None, bad, CoachRewrite(entries=[])]:
            sdk = MagicMock(); sdk.responses.parse.return_value = SimpleNamespace(output_parsed=output)
            with patch.dict(os.environ, {'OPENAI_API_KEY': 'unit-test-only', 'OPENAI_MODEL': 'configured-model'}), patch('app.feedback.OpenAI') as factory:
                factory.return_value.__enter__.return_value = sdk
                self.assertEqual(automatic_feedback(request).provider, 'LOCAL')
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'unit-test-only', 'OPENAI_MODEL': 'configured-model'}), patch('app.feedback.OpenAI', side_effect=TimeoutError):
            self.assertEqual(automatic_feedback(request).provider, 'LOCAL')
