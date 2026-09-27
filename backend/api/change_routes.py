from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.analyzers.change_detector import ChangeDetector


router = APIRouter(
    prefix="/api/changes",
    tags=["Change Detection"]
)


class ChangeRequest(BaseModel):
    old_path: str
    new_path: str


@router.post("/detect")
def detect_changes(request: ChangeRequest):

    try:

        detector = ChangeDetector(
            request.old_path,
            request.new_path
        )

        result = detector.detect_changes()

        return {
            "success": True,
            "result": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )