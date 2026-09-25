from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class ConsentPolicy(BaseModel):
    """
    Data model representing a patient's consent artifact.
    Follows ABHA/ABDM like structures for purpose and scope.
    """
    consent_id: str
    patient_id: str
    purpose: List[str]
    scope: List[str]
    valid_from: datetime
    valid_to: datetime
    is_active: bool = True
    is_revoked: bool = False
