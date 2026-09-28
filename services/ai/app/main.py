from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from .models import FormRequest, FormResponse
from .security import require_internal_token

app = FastAPI(title="FITNESS-MANAGE Form Feedback", version="2.0.0")


@app.middleware("http")
async def json_only(request: Request, call_next):
    if request.method == "POST":
        if request.headers.get("content-type", "").split(";")[0].strip() != "application/json":
            return JSONResponse(status_code=415, content={"code": "JSON_ONLY"})
        size = 0
        async for chunk in request.stream():
            size += len(chunk)
            if size > 8192:
                return JSONResponse(status_code=413, content={"code": "PAYLOAD_TOO_LARGE"})
            # Starlette caches body only through body(); bounded accumulation here.
            request.state.body_parts = getattr(request.state, "body_parts", []) + [chunk]
        request._body = b"".join(getattr(request.state, "body_parts", []))
    return await call_next(request)


@app.exception_handler(RequestValidationError)
async def invalid_payload(_request: Request, _error: RequestValidationError):
    # Do not echo rejected raw media, URLs, identifiers or arbitrary client input.
    return JSONResponse(status_code=422, content={"code": "INVALID_METRICS"})


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ai/form-analysis", response_model=FormResponse, dependencies=[Depends(require_internal_token)])
def form_analysis(request: FormRequest):
    if request.status == "POSE_NOT_DETECTED":
        feedback = ["Chưa nhận diện đủ tư thế. Quay lại toàn thân, đủ sáng và đặt máy ngang bên hông."]
    elif request.status == "INSUFFICIENT_REPS":
        feedback = ["Chưa ghi nhận được lần squat hoàn chỉnh. Video cần thể hiện cả tư thế đứng và hạ người."]
    elif request.issues:
        feedback = ["Một số lần squat có thể chưa đủ độ sâu. Hạ người chậm trong phạm vi thoải mái, giữ thăng bằng và nhờ PT kiểm tra nếu cần."]
    else:
        feedback = ["Chưa phát hiện lỗi độ sâu trong các lần squat được nhận diện. Kết quả này không đánh giá toàn bộ kỹ thuật."]
    # Deterministic feedback is sufficient for MVP; no LLM, plan or diagnosis.
    return FormResponse(status=request.status, feedback=feedback)
