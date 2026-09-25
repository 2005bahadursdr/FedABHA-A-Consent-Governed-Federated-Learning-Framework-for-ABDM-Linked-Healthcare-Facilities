from fastapi import APIRouter
from backend.api.state import app_state

router = APIRouter()

@router.get("/")
def get_audit_trail():
    return app_state["auditTrail"]
