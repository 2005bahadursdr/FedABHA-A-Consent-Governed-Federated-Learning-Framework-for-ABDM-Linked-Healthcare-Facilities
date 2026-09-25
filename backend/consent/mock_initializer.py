import pandas as pd
from datetime import datetime, timedelta
import random
from backend.consent.consent_manager import ConsentManager
from backend.consent.consent_policy import ConsentPolicy
from backend.db.database import get_consent_collection

def get_initialized_consent_manager(df) -> tuple[ConsentManager, dict]:
    manager = ConsentManager()
    collection = get_consent_collection()
    
    # Check if patients in df exist in DB, if not seed them
    for idx, row in df.iterrows():
        patient_id = row['patient_id']
        
        # Check if patient exists in MongoDB
        if collection.count_documents({"patient_id": patient_id}) == 0:
            rand = random.random()
            
            if rand < 0.05:
                # Blocked (expired)
                valid_to = datetime.utcnow() - timedelta(days=1)
                is_revoked = False
            elif rand < 0.07:
                # Revoked
                valid_to = datetime.utcnow() + timedelta(days=365)
                is_revoked = True
            else:
                # Approved
                valid_to = datetime.utcnow() + timedelta(days=365)
                is_revoked = False
                
            policy = ConsentPolicy(
                consent_id=f"cons_{patient_id}",
                patient_id=patient_id,
                purpose=["training", "research", "inference", "prediction", "view_record"],
                scope=["diabetes", "hypertension", "cardiac", "kidney", "general"],
                valid_from=datetime.utcnow() - timedelta(days=30),
                valid_to=valid_to,
                is_active=True,
                is_revoked=is_revoked
            )
            manager.add_consent(policy)
    
    # Calculate live stats directly from DB
    now_str = datetime.utcnow().isoformat()
    # Pymongo doesn't natively do string date comparisons well without proper Date objects,
    # but for simplicity we'll just pull them in memory or do a simple count.
    all_docs = list(collection.find({}))
    stats = {"approved": 0, "blocked": 0, "revoked": 0}
    
    now = datetime.utcnow()
    for doc in all_docs:
        is_revoked = doc.get("is_revoked", False)
        valid_to_str = doc.get("valid_to")
        if isinstance(valid_to_str, str):
            valid_to = datetime.fromisoformat(valid_to_str)
        else:
            valid_to = valid_to_str
            
        if is_revoked:
            stats["revoked"] += 1
        elif valid_to and valid_to < now:
            stats["blocked"] += 1
        else:
            stats["approved"] += 1

    return manager, stats
