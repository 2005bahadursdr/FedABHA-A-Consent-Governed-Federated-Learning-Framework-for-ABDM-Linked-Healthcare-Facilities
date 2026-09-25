from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.security.authentication import (
    USERS_DB, ROLE_METADATA, authenticate_user, generate_token
)

router = APIRouter()

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class QuickLoginRequest(BaseModel):
    role_key: str  # 'admin', 'hospital_A', 'hospital_B', 'hospital_C', 'auditor'

@router.post("/login")
def login(req: LoginRequest):
    user = authenticate_user(req.username_or_email, req.password)
    if not user:
        raise HTTPException(
            status_code=401, 
            detail="Invalid email/username or password. Try demo accounts: admin@fedabha.org / Admin@123"
        )
    
    token = generate_token(user)
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    
    return {
        "status": "success",
        "message": f"Authenticated successfully as {user['role_title']}",
        "access_token": token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/quick-login")
def quick_login(req: QuickLoginRequest):
    key_map = {
        "admin": "admin@fedabha.org",
        "super_admin": "admin@fedabha.org",
        "hospital_a": "hospital_a@fedabha.org",
        "hospital_A": "hospital_a@fedabha.org",
        "hospital_b": "hospital_b@fedabha.org",
        "hospital_B": "hospital_b@fedabha.org",
        "hospital_c": "hospital_c@fedabha.org",
        "hospital_C": "hospital_c@fedabha.org",
        "auditor": "auditor@fedabha.org"
    }
    
    email = key_map.get(req.role_key.lower())
    if not email or email not in USERS_DB:
        raise HTTPException(status_code=400, detail="Invalid role key provided.")
        
    user = USERS_DB[email]
    token = generate_token(user)
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    
    return {
        "status": "success",
        "message": f"Quick authenticated as {user['role_title']}",
        "access_token": token,
        "token_type": "bearer",
        "user": user_response
    }

@router.get("/roles")
def get_roles():
    return {
        "roles": ROLE_METADATA,
        "accounts": [
            {
                "role": u["role"],
                "role_title": u["role_title"],
                "email": u["email"],
                "username": u["username"],
                "name": u["name"],
                "hospital_id": u["hospital_id"],
                "hospital_name": u["hospital_name"]
            } for u in USERS_DB.values()
        ]
    }
