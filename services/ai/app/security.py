import hmac
import os
from fastapi import Header, HTTPException


def require_internal_token(x_service_token: str = Header(default="")) -> None:
    expected = os.environ.get("AI_SERVICE_TOKEN", "")
    if not expected or not hmac.compare_digest(expected, x_service_token):
        raise HTTPException(status_code=401, detail="Unauthorized")
