from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Metrics(StrictModel):
    minKneeAngle: float = Field(ge=0, le=180)
    detectedRatio: float = Field(ge=0, le=1)


class Issue(StrictModel):
    code: Literal["INSUFFICIENT_DEPTH"]
    confidence: float = Field(ge=0, le=1)


class FormRequest(StrictModel):
    schemaVersion: Literal["1.0"]
    exercise: Literal["SQUAT"]
    status: Literal["COMPLETED", "POSE_NOT_DETECTED", "INSUFFICIENT_REPS"]
    reps: int = Field(ge=0, le=500)
    metrics: Metrics
    issues: list[Issue] = Field(max_length=1)

    @model_validator(mode="after")
    def validate_result(self):
        if self.status != "COMPLETED" and self.issues:
            raise ValueError("Failed pose analysis cannot contain form issues")
        if self.status == "COMPLETED" and (self.reps == 0 or self.metrics.detectedRatio < 0.6):
            raise ValueError("Completed analysis needs reliable pose and repetitions")
        return self


class FormResponse(StrictModel):
    schemaVersion: Literal["1.0"] = "1.0"
    status: Literal["COMPLETED", "POSE_NOT_DETECTED", "INSUFFICIENT_REPS"]
    feedback: list[str]
