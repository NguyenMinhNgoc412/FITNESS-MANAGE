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


Exercise = Literal["SQUAT", "PUSH_UP", "LUNGE", "UNKNOWN"]
AutoStatus = Literal["COMPLETED", "POSE_NOT_DETECTED", "INSUFFICIENT_REPS", "UNRECOGNIZED_EXERCISE"]


class Angles(StrictModel):
    kneeLeft: float | None = Field(ge=0, le=180)
    kneeRight: float | None = Field(ge=0, le=180)
    trunk: float | None = Field(ge=0, le=90)
    elbowLeft: float | None = Field(ge=0, le=180)
    elbowRight: float | None = Field(ge=0, le=180)
    armLeft: float | None = Field(ge=0, le=90)
    armRight: float | None = Field(ge=0, le=90)


class Rep(StrictModel):
    index: int = Field(ge=1, le=500)
    timeSeconds: float = Field(ge=0, le=120)
    angles: Angles
    bodyLine: float | None = Field(ge=0, le=180)


class AutoMetrics(StrictModel):
    detectedRatio: float = Field(ge=0, le=1)
    minJointAngle: float | None = Field(ge=0, le=180)


class Reference(StrictModel):
    trunkMax: float | None = Field(ge=0, le=90)


class AutoFormRequest(StrictModel):
    schemaVersion: Literal["2.0"]
    exercise: Exercise
    status: AutoStatus
    recognitionScore: float = Field(ge=0, le=1)
    reps: int = Field(ge=0, le=500)
    metrics: AutoMetrics
    reference: Reference
    perRep: list[Rep] = Field(max_length=10)

    @model_validator(mode="after")
    def validate_evidence(self):
        if self.status == "COMPLETED":
            if self.exercise == "UNKNOWN" or self.reps == 0 or self.recognitionScore < 0.7 or self.metrics.detectedRatio < 0.6 or self.metrics.minJointAngle is None or len(self.perRep) != min(self.reps, 10):
                raise ValueError("Completed analysis needs evidence")
        elif self.perRep or self.reps:
            raise ValueError("Failed analysis cannot contain form conclusions")
        if self.status == "UNRECOGNIZED_EXERCISE" and self.exercise != "UNKNOWN":
            raise ValueError("Unknown exercise must remain unknown")
        if any(rep.index != i + 1 for i, rep in enumerate(self.perRep)):
            raise ValueError("Invalid repetition order")
        return self


class AutoFormResponse(StrictModel):
    schemaVersion: Literal["2.0"] = "2.0"
    exercise: Exercise
    status: AutoStatus
    provider: Literal["OPENAI", "LOCAL"]
    feedback: list[str] = Field(min_length=1, max_length=8)
