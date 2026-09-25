from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.federated_api import router as fl_router
from backend.api.hospital_api import router as hospital_router
from backend.api.consent_api import router as consent_router
from backend.api.audit_api import router as audit_router
from backend.api.prediction_api import router as prediction_router
from backend.api.auth_api import router as auth_router

app = FastAPI(title="FedABHA-X API", version="1.0.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication & RBAC"])
app.include_router(fl_router, prefix="/api/fl", tags=["Federated Learning"])
app.include_router(hospital_router, prefix="/api/hospitals", tags=["Hospitals"])
app.include_router(consent_router, prefix="/api/consent", tags=["Consent"])
app.include_router(audit_router, prefix="/api/audit", tags=["Audit"])
app.include_router(prediction_router, prefix="/api/predictions", tags=["Predictions"])

@app.get("/")
def root():
    return {"status": "FedABHA-X Backend Online"}
