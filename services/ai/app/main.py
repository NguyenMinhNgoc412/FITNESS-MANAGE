from fastapi import Depends, FastAPI
from .analyzer import analyze_video
from .generation import generate_plan
from .models import PlanRequest, PoseRequest, StructuredPoseResult, TrainingPlan
from .security import require_internal_token

app = FastAPI(title="FITNESS-MANAGE AI Service", version="1.0.0")

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/v1/analyze/pose", response_model=StructuredPoseResult, dependencies=[Depends(require_internal_token)])
def pose(request: PoseRequest) -> StructuredPoseResult:
    return analyze_video(request.mediaUrl)

@app.post("/v1/generate/plan", response_model=TrainingPlan, dependencies=[Depends(require_internal_token)])
def plan(request: PlanRequest) -> TrainingPlan:
    return generate_plan(request.structuredResult, request.goal)
