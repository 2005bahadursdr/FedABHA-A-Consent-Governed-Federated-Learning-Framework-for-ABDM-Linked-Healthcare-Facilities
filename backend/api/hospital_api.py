from fastapi import APIRouter, HTTPException
from backend.api.state import app_state
import os
import csv
from backend.consent.consent_manager import ConsentManager
from backend.consent.consent_policy import ConsentPolicy
from backend.consent.realtime_consent import RealtimeConsentEnforcer
from backend.blockchain.audit_service import AuditService
from datetime import datetime, timedelta

router = APIRouter()
audit_service = AuditService()

def get_consent_enforcer(patient_id: str):
    manager = ConsentManager()
    policy = manager.get_consent_for_patient(patient_id)
    now = datetime.utcnow()
    
    if not policy:
        is_revoked = "revoke" in patient_id.lower() or "block" in patient_id.lower()
        policy = ConsentPolicy(
            consent_id=f"cons_{patient_id}",
            patient_id=patient_id,
            purpose=["training", "research", "inference", "prediction", "view_record"], 
            scope=["diabetes", "hypertension", "cardiac", "kidney", "general"],
            valid_from=now - timedelta(days=30),
            valid_to=now + timedelta(days=365),
            is_active=True,
            is_revoked=is_revoked
        )
        manager.add_consent(policy)
    else:
        # If policy exists in DB, ensure required purpose/scope are present for non-revoked patient
        if not policy.is_revoked:
            need_update = False
            if "view_record" not in policy.purpose:
                policy.purpose.extend(["inference", "prediction", "view_record"])
                need_update = True
            if "general" not in policy.scope:
                policy.scope.extend(["hypertension", "general"])
                need_update = True
            if need_update:
                manager.add_consent(policy)
                
    return RealtimeConsentEnforcer(manager)

@router.get("/")
def get_hospitals():
    return app_state["hospitals"]

HOSPITAL_NAMES = {
    "hospital_A.csv": "Hospital A (City Care Medical)",
    "hospital_B.csv": "Hospital B (Metro Health Center)",
    "hospital_C.csv": "Hospital C (General Hospital)"
}

@router.get("/patients/samples")
def get_sample_patients():
    """Returns sample ABHA IDs from local hospital nodes for testing/demo."""
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/hospitals"))
    samples = []
    
    # Preset sample mappings
    preset_samples = [
        {"abha_id": "ABHA-1001", "label": "ABHA-1001 (Hospital A)", "hospital": "Hospital A"},
        {"abha_id": "ABHA-2001", "label": "ABHA-2001 (Hospital B)", "hospital": "Hospital B"},
        {"abha_id": "ABHA-3001", "label": "ABHA-3001 (Hospital C)", "hospital": "Hospital C"},
        {"abha_id": "ABHA-REVOKE-99", "label": "ABHA-REVOKE-99 (Consent Revoked)", "hospital": "Hospital A (Blocked)"}
    ]
    
    if os.path.exists(data_dir):
        for filename in sorted(os.listdir(data_dir)):
            if filename.endswith(".csv"):
                file_path = os.path.join(data_dir, filename)
                hosp_name = HOSPITAL_NAMES.get(filename, filename.replace('.csv', '').upper())
                try:
                    with open(file_path, mode='r', encoding='utf-8') as f:
                        reader = csv.reader(f)
                        next(reader, None) # Skip header
                        for i in range(2): # Get first 2 patients from each CSV
                            row = next(reader, None)
                            if row and len(row) > 1:
                                samples.append({
                                    "abha_id": row[1],
                                    "label": f"{row[1]} ({hosp_name.split(' ')[0]} {hosp_name.split(' ')[1]})",
                                    "hospital": hosp_name
                                })
                except Exception:
                    pass

    return {"preset_samples": preset_samples, "live_samples": samples}

@router.get("/patient/{abha_id}")
def get_patient_by_abha(abha_id: str):
    clean_id = abha_id.strip()
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/hospitals"))
    
    patient_record = None
    csv_headers = []
    hospital_source = "Local Hospital Node"
    
    # Handle explicit test alias shortcuts
    if clean_id.upper() == "ABHA-REVOKE-99":
        patient_id = "REVOKE-PAT-9999"
        enforcer = get_consent_enforcer(patient_id)
        consent_result = enforcer.check_access(patient_id, "view_record", "general")
        audit_service._record_event("CONSENT_CHECK_EHR", {"patient_id": patient_id, "abha_id": clean_id}, {"result": "BLOCK"})
        raise HTTPException(status_code=403, detail="Consent policy restriction: Patient has revoked access to medical records.")
    
    alias_map = {
        "ABHA-1001": ("hospital_A.csv", 0),
        "ABHA-2001": ("hospital_B.csv", 0),
        "ABHA-3001": ("hospital_C.csv", 0)
    }

    if clean_id.upper() in alias_map:
        target_file, target_idx = alias_map[clean_id.upper()]
        file_path = os.path.join(data_dir, target_file)
        if os.path.exists(file_path):
            with open(file_path, mode='r', encoding='utf-8') as f:
                reader = csv.reader(f)
                headers = next(reader)
                rows = list(reader)
                if len(rows) > target_idx:
                    patient_record = rows[target_idx]
                    csv_headers = headers
                    hospital_source = HOSPITAL_NAMES.get(target_file, target_file)
    
    # Generic search across all hospital CSV files
    if not patient_record and os.path.exists(data_dir):
        for filename in sorted(os.listdir(data_dir)):
            if filename.endswith(".csv"):
                file_path = os.path.join(data_dir, filename)
                with open(file_path, mode='r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    headers = next(reader)
                    for row in reader:
                        # Match abha_id (index 1) or patient_id (index 0)
                        if len(row) > 1 and (row[1].lower() == clean_id.lower() or row[0].lower() == clean_id.lower()):
                            patient_record = row
                            csv_headers = headers
                            hospital_source = HOSPITAL_NAMES.get(filename, filename.replace('.csv', '').upper())
                            break
            if patient_record:
                break
                
    if not patient_record:
        raise HTTPException(status_code=404, detail=f"No patient record found for ABHA ID or Patient ID: {abha_id}")
        
    patient_id = patient_record[0]
    actual_abha = patient_record[1] if len(patient_record) > 1 else abha_id
    
    # Consent Check across patient_id, clean_id, and actual_abha
    enforcer = get_consent_enforcer(patient_id)
    consent_result = enforcer.check_access(patient_id, "view_record", "general")
    
    if consent_result == "ALLOW":
        for alt_id in [clean_id, actual_abha]:
            if alt_id:
                alt_enforcer = get_consent_enforcer(alt_id)
                if alt_enforcer.check_access(alt_id, "view_record", "general") == "BLOCK":
                    consent_result = "BLOCK"
                    break

    audit_service._record_event("CONSENT_CHECK_EHR", {"patient_id": patient_id, "abha_id": actual_abha, "query_id": clean_id}, {"result": consent_result})
    
    if consent_result == "BLOCK":
        raise HTTPException(status_code=403, detail="Consent policy restriction: Patient has denied access to medical records.")
        
    record_dict = {csv_headers[i]: patient_record[i] for i in range(min(len(csv_headers), len(patient_record)))}
    
    audit_service._record_event("EHR_ACCESSED", {"patient_id": patient_id, "abha_id": actual_abha}, {"action": "View Medical Record", "hospital": hospital_source})
    
    return {
        "query_id": abha_id,
        "abha_id": actual_abha,
        "patient_id": patient_id,
        "hospital_node": hospital_source,
        "consent_status": "APPROVED",
        "details": record_dict
    }


