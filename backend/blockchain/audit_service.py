from typing import Dict, Any
from .hash_utils import hash_data
from .blockchain_client import LocalBlockchainClient

class AuditService:
    """
    Service responsible for structuring audit events and interfacing with the blockchain.
    Enforces privacy by hashing sensitive identifiers before submission.
    """
    def __init__(self, blockchain_client=None):
        if blockchain_client is None:
            self.blockchain_client = LocalBlockchainClient()
        else:
            self.blockchain_client = blockchain_client
            
    def _record_event(self, event_type: str, sensitive_payload: Dict[str, Any], safe_metadata: Dict[str, Any]) -> str:
        """
        Hashes the sensitive payload to ensure on-chain privacy, and submits the transaction.
        Raw records and plaintext identifiers are never stored on the blockchain.
        """
        payload_hash = hash_data(sensitive_payload)
        tx_id = self.blockchain_client.submit_transaction(event_type, payload_hash, safe_metadata)
        
        # Post to FastAPI Dashboard webhook
        try:
            import requests
            from datetime import datetime
            requests.post("http://127.0.0.1:8000/api/fl/audit", json={
                "tx_id": tx_id,
                "event": event_type,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            })
        except Exception:
            pass
            
        return tx_id

    def log_consent_granted(self, abha_id: str, consent_id: str, purpose: str):
        sensitive = {"abha_id": abha_id, "consent_id": consent_id}
        metadata = {"purpose_hash": hash_data(purpose)}
        return self._record_event("CONSENT_GRANTED", sensitive, metadata)
        
    def log_consent_revoked(self, abha_id: str, consent_id: str):
        sensitive = {"abha_id": abha_id, "consent_id": consent_id}
        return self._record_event("CONSENT_REVOKED", sensitive, {})
        
    def log_consent_expired(self, abha_id: str, consent_id: str):
        sensitive = {"abha_id": abha_id, "consent_id": consent_id}
        return self._record_event("CONSENT_EXPIRED", sensitive, {})

    def log_training_started(self, hospital_id: str, round_num: int):
        safe_meta = {"hospital_id": hospital_id, "round_num": round_num}
        return self._record_event("TRAINING_STARTED", {}, safe_meta)
        
    def log_training_blocked(self, hospital_id: str, reason: str):
        safe_meta = {"hospital_id": hospital_id, "reason": reason}
        return self._record_event("TRAINING_BLOCKED", {}, safe_meta)
        
    def log_hospital_participated(self, hospital_id: str, round_num: int):
        safe_meta = {"hospital_id": hospital_id, "round_num": round_num}
        return self._record_event("HOSPITAL_PARTICIPATED", {}, safe_meta)
        
    def log_anomaly_detected(self, hospital_id: str, anomaly_score: float):
        safe_meta = {"hospital_id": hospital_id, "anomaly_score": anomaly_score}
        return self._record_event("ANOMALY_DETECTED", {}, safe_meta)
        
    def log_trust_score_changed(self, hospital_id: str, new_score: float, reason: str):
        safe_meta = {"hospital_id": hospital_id, "new_score": new_score, "reason": reason}
        return self._record_event("TRUST_SCORE_CHANGED", {}, safe_meta)
        
    def log_fl_round_completed(self, round_num: int, global_model_hash: str):
        safe_meta = {"round_num": round_num, "global_model_hash": global_model_hash}
        return self._record_event("FL_ROUND_COMPLETED", {}, safe_meta)
