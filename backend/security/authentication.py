import hashlib
import hmac
import secrets
from typing import Dict, Any, Optional, List

# Security Key for HMAC token generation
SECRET_KEY = "fedabha_x_super_secret_rbac_key_2026"

# Predefined Accounts with Role-Based Access Control (RBAC)
USERS_DB: Dict[str, Dict[str, Any]] = {
    "admin@fedabha.org": {
        "id": "USR-001",
        "username": "admin",
        "email": "admin@fedabha.org",
        "name": "Super Administrator",
        "password_hash": hashlib.sha256("Admin@123".encode()).hexdigest(),
        "role": "admin",
        "role_title": "Super Admin",
        "hospital_id": None,
        "hospital_name": "Global Network Operator",
        "permissions": [
            "full_system_control",
            "manage_hospitals",
            "manage_users",
            "view_fl_rounds",
            "trigger_fl_rounds",
            "view_consent",
            "manage_consent",
            "view_security_audit_logs",
            "predict_risk"
        ]
    },
    "hospital_a@fedabha.org": {
        "id": "USR-002",
        "username": "hospital_a",
        "email": "hospital_a@fedabha.org",
        "name": "Hospital Admin (City Care)",
        "password_hash": hashlib.sha256("Hospital@123".encode()).hexdigest(),
        "role": "hospital",
        "role_title": "Hospital Admin",
        "hospital_id": "hospital_A",
        "hospital_name": "City Care Medical",
        "permissions": [
            "hospital_node_access",
            "start_local_training",
            "view_own_consent",
            "grant_local_consent",
            "view_own_fl_results"
        ]
    },
    "hospital_b@fedabha.org": {
        "id": "USR-003",
        "username": "hospital_b",
        "email": "hospital_b@fedabha.org",
        "name": "Hospital Admin (Metro Health)",
        "password_hash": hashlib.sha256("Hospital@123".encode()).hexdigest(),
        "role": "hospital",
        "role_title": "Hospital Admin",
        "hospital_id": "hospital_B",
        "hospital_name": "Metro Health",
        "permissions": [
            "hospital_node_access",
            "start_local_training",
            "view_own_consent",
            "grant_local_consent",
            "view_own_fl_results"
        ]
    },
    "hospital_c@fedabha.org": {
        "id": "USR-004",
        "username": "hospital_c",
        "email": "hospital_c@fedabha.org",
        "name": "Hospital Admin (General Hospital)",
        "password_hash": hashlib.sha256("Hospital@123".encode()).hexdigest(),
        "role": "hospital",
        "role_title": "Hospital Admin",
        "hospital_id": "hospital_C",
        "hospital_name": "General Hospital",
        "permissions": [
            "hospital_node_access",
            "start_local_training",
            "view_own_consent",
            "grant_local_consent",
            "view_own_fl_results"
        ]
    },
    "auditor@fedabha.org": {
        "id": "USR-005",
        "username": "auditor",
        "email": "auditor@fedabha.org",
        "name": "Compliance Auditor",
        "password_hash": hashlib.sha256("Auditor@123".encode()).hexdigest(),
        "role": "auditor",
        "role_title": "Auditor",
        "hospital_id": None,
        "hospital_name": "Independent Regulatory Body",
        "permissions": [
            "read_only_access",
            "view_consent_history",
            "view_revocation_events",
            "view_fl_participation_logs",
            "view_security_events"
        ]
    }
}

ROLE_METADATA = {
    "admin": {
        "name": "Super Admin",
        "description": "Full system control, hospital node management, global FL execution, consent governance, security audit logs.",
        "badge_color": "bg-purple-950/60 text-purple-300 border-purple-500/40"
    },
    "hospital": {
        "name": "Hospital Admin",
        "description": "Hospital A/B/C local node access, start/participate in local training, view own consent status & FL results.",
        "badge_color": "bg-blue-950/60 text-blue-300 border-blue-500/40"
    },
    "auditor": {
        "name": "Auditor",
        "description": "Read-only audit access to consent history, revocation events, FL participation logs, and security events.",
        "badge_color": "bg-amber-950/60 text-amber-300 border-amber-500/40"
    }
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def authenticate_user(login_identifier: str, password: str) -> Optional[Dict[str, Any]]:
    identifier = login_identifier.strip().lower()
    user = None
    
    # Check by email or username
    for account in USERS_DB.values():
        if account["email"].lower() == identifier or account["username"].lower() == identifier:
            user = account
            break
            
    if not user:
        return None
        
    if not verify_password(password, user["password_hash"]):
        return None
        
    return user

def generate_token(user: Dict[str, Any]) -> str:
    payload = f"{user['id']}:{user['role']}:{user['email']}"
    token_sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"bearer-{payload}-{token_sig[:16]}"
