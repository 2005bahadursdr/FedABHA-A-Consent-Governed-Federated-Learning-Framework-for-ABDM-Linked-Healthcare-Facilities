from fastapi import APIRouter
from backend.api.state import app_state, save_state
from backend.consent.consent_manager import ConsentManager
from backend.blockchain.audit_service import AuditService
import uuid
from datetime import datetime

router = APIRouter()
manager = ConsentManager()
audit_service = AuditService()

ID_MAP = {
    "ABHA-1001": "PAT-1001",
    "ABHA-2001": "PAT-2001",
    "ABHA-3001": "PAT-3001",
    "ABHA-REVOKE-99": "REVOKE-PAT-9999",
    "PAT-1001": "ABHA-1001",
    "PAT-2001": "ABHA-2001",
    "PAT-3001": "ABHA-3001",
}

@router.get("/")
def get_consent_stats():
    return app_state["consentStats"]

@router.post("/grant/{patient_id}")
def grant_consent(patient_id: str, valid_days: int = 365):
    clean_id = patient_id.strip()
    target_ids = [clean_id]
    if clean_id in ID_MAP:
        target_ids.append(ID_MAP[clean_id])

    for pid in target_ids:
        manager.grant_consent(pid, valid_days=valid_days)
        audit_service.log_consent_granted(pid, f"cons_{pid}", f"training,research,view_record (Valid {valid_days}d)")

    # Update app_state consent stats
    if valid_days <= 0:
        # Expired consent -> count as blocked
        app_state["consentStats"]["blocked"] += 1
        if app_state["consentStats"]["approved"] > 0:
            app_state["consentStats"]["approved"] -= 1
        status_msg = f"Consent set to EXPIRED/BLOCKED for {clean_id}"
    else:
        app_state["consentStats"]["approved"] += 1
        if app_state["consentStats"]["revoked"] > 0:
            app_state["consentStats"]["revoked"] -= 1
        if app_state["consentStats"]["blocked"] > 0:
            app_state["consentStats"]["blocked"] -= 1
        status_msg = f"Consent granted for {clean_id} (Validity: {valid_days} days)"

    # Record in audit trail
    tx_id = f"tx-{uuid.uuid4().hex[:8]}"
    app_state["auditTrail"].insert(0, {
        "tx_id": tx_id,
        "event": f"CONSENT_GRANTED for Patient/ABHA ID: {clean_id} (Valid: {valid_days} days)",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    app_state["auditTrail"] = app_state["auditTrail"][:50]

    save_state()
    return {
        "status": "success",
        "message": status_msg,
        "patient_id": clean_id,
        "valid_days": valid_days,
        "is_revoked": False,
        "consentStats": app_state["consentStats"]
    }

@router.post("/revoke/{patient_id}")
def revoke_consent(patient_id: str):
    clean_id = patient_id.strip()
    target_ids = [clean_id]
    if clean_id in ID_MAP:
        target_ids.append(ID_MAP[clean_id])

    for pid in target_ids:
        manager.revoke_consent(pid)
        audit_service.log_consent_revoked(pid, f"cons_{pid}")

    # Update app_state consent stats
    app_state["consentStats"]["revoked"] += 1
    app_state["consentStats"]["blocked"] += 1
    if app_state["consentStats"]["approved"] > 0:
        app_state["consentStats"]["approved"] -= 1

    # Record in audit trail
    tx_id = f"tx-{uuid.uuid4().hex[:8]}"
    app_state["auditTrail"].insert(0, {
        "tx_id": tx_id,
        "event": f"CONSENT_REVOKED for Patient/ABHA ID: {clean_id}",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    app_state["auditTrail"] = app_state["auditTrail"][:50]

    save_state()
    return {
        "status": "success",
        "message": f"Consent revoked for {clean_id}",
        "patient_id": clean_id,
        "is_revoked": True,
        "consentStats": app_state["consentStats"]
    }

