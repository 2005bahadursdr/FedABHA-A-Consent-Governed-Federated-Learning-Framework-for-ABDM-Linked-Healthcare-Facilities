from typing import Optional
from .consent_policy import ConsentPolicy
from backend.db.database import get_consent_collection
from datetime import datetime, timedelta

class ConsentManager:
    """
    MongoDB-backed CRUD store for consent artifacts.
    """
    def __init__(self):
        self.collection = get_consent_collection()
        self._cache = {}
        
    def preload_consents(self, patient_ids: list[str]):
        docs = self.collection.find({"patient_id": {"$in": patient_ids}})
        for doc in docs:
            valid_from = doc.get("valid_from")
            if isinstance(valid_from, str):
                valid_from = datetime.fromisoformat(valid_from)
                
            valid_to = doc.get("valid_to")
            if isinstance(valid_to, str):
                valid_to = datetime.fromisoformat(valid_to)
                
            self._cache[doc["patient_id"]] = ConsentPolicy(
                consent_id=doc.get("consent_id", f"cons_{doc.get('patient_id')}"),
                patient_id=doc.get("patient_id"),
                purpose=doc.get("purpose", []),
                scope=doc.get("scope", []),
                valid_from=valid_from,
                valid_to=valid_to,
                is_active=doc.get("is_active", True),
                is_revoked=doc.get("is_revoked", False)
            )

    def add_consent(self, consent: ConsentPolicy):
        # Upsert based on patient_id
        doc = consent.dict()
        if "valid_from" in doc and doc["valid_from"]:
            doc["valid_from"] = doc["valid_from"].isoformat()
        if "valid_to" in doc and doc["valid_to"]:
            doc["valid_to"] = doc["valid_to"].isoformat()
            
        self.collection.update_one(
            {"patient_id": consent.patient_id},
            {"$set": doc},
            upsert=True
        )
        self._cache[consent.patient_id] = consent
        
    def get_consent_for_patient(self, patient_id: str) -> Optional[ConsentPolicy]:
        if patient_id in self._cache:
            return self._cache[patient_id]
            
        doc = self.collection.find_one({"patient_id": patient_id})
        if doc:
            valid_from = doc.get("valid_from")
            if isinstance(valid_from, str):
                valid_from = datetime.fromisoformat(valid_from)
                
            valid_to = doc.get("valid_to")
            if isinstance(valid_to, str):
                valid_to = datetime.fromisoformat(valid_to)
                
            policy = ConsentPolicy(
                consent_id=doc.get("consent_id", f"cons_{patient_id}"),
                patient_id=doc.get("patient_id"),
                purpose=doc.get("purpose", []),
                scope=doc.get("scope", []),
                valid_from=valid_from,
                valid_to=valid_to,
                is_active=doc.get("is_active", True),
                is_revoked=doc.get("is_revoked", False)
            )
            self._cache[patient_id] = policy
            return policy
        return None
        
    def revoke_consent(self, patient_id: str):
        policy = self.get_consent_for_patient(patient_id)
        now = datetime.utcnow()
        if not policy:
            policy = ConsentPolicy(
                consent_id=f"cons_{patient_id}",
                patient_id=patient_id,
                purpose=["training", "research", "inference", "prediction", "view_record"],
                scope=["diabetes", "hypertension", "cardiac", "kidney", "general"],
                valid_from=now - timedelta(days=30),
                valid_to=now + timedelta(days=365),
                is_active=True,
                is_revoked=True
            )
            self.add_consent(policy)
        else:
            policy.is_revoked = True
            self.add_consent(policy)

    def grant_consent(self, patient_id: str, valid_days: int = 365):
        policy = self.get_consent_for_patient(patient_id)
        now = datetime.utcnow()
        if valid_days <= 0:
            valid_to = now - timedelta(days=1)
        else:
            valid_to = now + timedelta(days=valid_days)

        if not policy:
            policy = ConsentPolicy(
                consent_id=f"cons_{patient_id}",
                patient_id=patient_id,
                purpose=["training", "research", "inference", "prediction", "view_record"],
                scope=["diabetes", "hypertension", "cardiac", "kidney", "general"],
                valid_from=now - timedelta(days=30),
                valid_to=valid_to,
                is_active=True,
                is_revoked=False
            )
            self.add_consent(policy)
        else:
            policy.is_revoked = False
            policy.valid_to = valid_to
            self.add_consent(policy)


