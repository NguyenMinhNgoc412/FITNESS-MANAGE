import json
import os
from openai import OpenAI
from .models import PlanPayload, StructuredPoseResult, TrainingPlan

PROMPT_VERSION = "fitness-plan-openai-1.0.0"

def generate_plan(structured: StructuredPoseResult, goal: str) -> TrainingPlan:
    if structured.inputQuality.status != "VALID":
        raise ValueError("Structured result is not valid for generation")
    api_key = os.environ.get("OPENAI_API_KEY")
    model = os.environ.get("OPENAI_MODEL")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY must be configured")
    if not model:
        raise RuntimeError("OPENAI_MODEL must be configured by Owner")
    client = OpenAI(api_key=api_key)
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": "Use only structured CV/pose JSON and the supplied goal. Do not diagnose medical conditions or injuries. State limitations and uncertainty. Return valid JSON with exactly these top-level fields: summary (string), focusAreas (string array), recommendations (string array), trainingPlan (object whose values are arrays of phases; every phase has name, durationWeeks, goals, exercises), limitations (string array), safetyFlags (string array)."}, {"role": "user", "content": json.dumps({"structuredResult": structured.model_dump(), "memberGoal": goal}, ensure_ascii=False)}],
            response_format={"type": "json_object"},
        )
    finally:
        client.close()
    content = response.choices[0].message.content
    if not content:
        raise ValueError("OpenAI returned an empty structured response")
    payload = PlanPayload.model_validate_json(content)
    return TrainingPlan(**payload.model_dump(), promptVersion=PROMPT_VERSION, modelVersion=model)
