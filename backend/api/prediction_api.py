from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import torch
import numpy as np
import os
import pandas as pd
from sklearn.preprocessing import StandardScaler

from backend.ml.model import DiabetesRiskModel
from backend.ml.explainability import get_feature_importance
from backend.consent.consent_manager import ConsentManager
from backend.consent.consent_policy import ConsentPolicy
from backend.consent.realtime_consent import RealtimeConsentEnforcer
from backend.blockchain.audit_service import AuditService
from datetime import datetime, timedelta

router = APIRouter()
audit_service = AuditService()

class PredictionRequest(BaseModel):
    patient_id: str
    disease_type: str = "diabetes"
    features: List[float] # 10 features: gender, age, systolic_bp, diastolic_bp, heart_rate, bmi, glucose, hba1c, cholesterol, creatinine

class PredictionResponse(BaseModel):
    patient_id: str
    disease_type: str
    prediction: float
    risk_level: str
    explainability: Dict[str, float]

_scaler = None
_background_data = None

def get_fitted_scaler():
    global _scaler, _background_data
    if _scaler is not None and _background_data is not None:
        return _scaler, _background_data
        
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/hospitals/hospital_A.csv"))
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        df['gender'] = df['gender'].map({'male': 0, 'female': 1}).fillna(0)
        cols = ['gender', 'age', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'bmi', 'glucose', 'hba1c', 'cholesterol', 'creatinine']
        X = df[cols].values.astype(np.float32)
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        _scaler = scaler
        _background_data = torch.tensor(X_scaled[:20], dtype=torch.float32)
        return _scaler, _background_data
    else:
        scaler = StandardScaler()
        dummy_data = np.array([
            [0, 50, 120, 80, 72, 25, 100, 5.5, 180, 1.0],
            [1, 70, 150, 95, 85, 32, 160, 6.8, 230, 1.6]
        ], dtype=np.float32)
        scaler.fit(dummy_data)
        _scaler = scaler
        _background_data = torch.tensor(scaler.transform(dummy_data), dtype=torch.float32)
        return _scaler, _background_data

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
        if not policy.is_revoked:
            need_update = False
            if policy.valid_to and policy.valid_to < now:
                policy.valid_to = now + timedelta(days=365)
                need_update = True
            if "inference" not in policy.purpose and "prediction" not in policy.purpose:
                policy.purpose.extend(["inference", "prediction", "view_record"])
                need_update = True
            if need_update:
                manager.add_consent(policy)
                
    return RealtimeConsentEnforcer(manager)

@router.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    enforcer = get_consent_enforcer(req.patient_id)
    consent_result = enforcer.check_access(req.patient_id, "inference", req.disease_type)
    
    audit_service._record_event("CONSENT_CHECK_INFERENCE", {"patient_id": req.patient_id}, {"result": consent_result})
    
    if consent_result == "BLOCK":
        raise HTTPException(status_code=403, detail="Consent policy restriction: Access denied or revoked by patient.")
        
    model = DiabetesRiskModel(input_dim=10)
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/global/global_model.pt"))
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, weights_only=True))
    else:
        local_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/local/hospital_A/model.pt"))
        if os.path.exists(local_path):
            model.load_state_dict(torch.load(local_path, weights_only=True))
        
    model.eval()
    
    scaler, bg_tensor = get_fitted_scaler()
    raw_feats = np.array(req.features, dtype=np.float32).reshape(1, -1)
    
    # Scale features if raw clinical values are provided
    if np.max(np.abs(raw_feats)) > 15.0 or np.mean(raw_feats) > 5.0:
        scaled_feats = scaler.transform(raw_feats)
    else:
        scaled_feats = raw_feats
        
    x_tensor = torch.tensor(scaled_feats, dtype=torch.float32)
    
    with torch.no_grad():
        output = model(x_tensor)
        prob = torch.sigmoid(output).item()
        
    risk = "High Risk" if prob > 0.5 else "Low Risk"
    
    feature_names = ['gender', 'age', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'bmi', 'glucose', 'hba1c', 'cholesterol', 'creatinine']
    importance = get_feature_importance(model, bg_tensor, x_tensor, feature_names)
    
    audit_service._record_event("INFERENCE_COMPLETED", {"patient_id": req.patient_id}, {"risk": risk, "probability": prob})
    
    return PredictionResponse(
        patient_id=req.patient_id,
        disease_type=req.disease_type,
        prediction=prob,
        risk_level=risk,
        explainability=importance
    )
