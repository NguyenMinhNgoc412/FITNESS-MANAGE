from typing import Any, Literal
from pydantic import BaseModel, Field

class InputQuality(BaseModel):
    status: Literal["VALID", "NEEDS_RETAKE", "INSUFFICIENT"]
    reasons: list[str]

class PoseData(BaseModel):
    features: dict[str, Any]
    keypoints: list[dict[str, Any]]
    derivedMetrics: dict[str, Any]

class StructuredPoseResult(BaseModel):
    schemaVersion: str
    inputQuality: InputQuality
    pose: PoseData
    confidence: dict[str, Any]
    warnings: list[str]
    analyzerVersion: str

class PoseRequest(BaseModel):
    mediaUrl: str
    correlationId: str

class PlanRequest(BaseModel):
    structuredResult: StructuredPoseResult
    goal: str = Field(min_length=1)
    correlationId: str

class TrainingPhase(BaseModel):
    name: str
    durationWeeks: int = Field(ge=1)
    goals: list[str]
    exercises: list[str]

class PlanPayload(BaseModel):
    summary: str
    focusAreas: list[str]
    recommendations: list[str]
    trainingPlan: dict[str, list[TrainingPhase]]
    limitations: list[str]
    safetyFlags: list[str]

class TrainingPlan(PlanPayload):
    promptVersion: str
    modelVersion: str
