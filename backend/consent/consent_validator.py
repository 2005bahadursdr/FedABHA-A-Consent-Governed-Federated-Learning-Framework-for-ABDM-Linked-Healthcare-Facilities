from datetime import datetime
from typing import Optional
from .consent_policy import ConsentPolicy

class ConsentValidator:
    """
    Validates a consent policy against a specific data request based on ABDM rules.
    """
    @staticmethod
    def evaluate(consent: Optional[ConsentPolicy], requested_purpose: str, requested_scope: str, current_time: Optional[datetime] = None) -> str:
        # Rule 1: Consent must exist.
        if not consent:
            return "BLOCK"
            
        # Rule 2: Consent must be active.
        if not consent.is_active:
            return "BLOCK"
            
        # Rule 4: Consent must not be revoked.
        if consent.is_revoked:
            return "BLOCK"
            
        # Rule 3: Current time must be within validity period.
        if current_time is None:
            current_time = datetime.utcnow()
            
        # Ensure timezone-naive comparison if needed, or assume all UTC
        # If the consent datetimes have tzinfo, make current_time aware
        if consent.valid_from.tzinfo is not None and current_time.tzinfo is None:
            current_time = current_time.replace(tzinfo=consent.valid_from.tzinfo)
            
        if not (consent.valid_from <= current_time <= consent.valid_to):
            return "BLOCK"
            
        # Rule 5: Requested purpose must match.
        if requested_purpose not in consent.purpose and "all" not in consent.purpose and "general" not in consent.purpose:
            return "BLOCK"
            
        # Rule 6: Requested scope must match.
        if requested_scope not in consent.scope and "all" not in consent.scope and "general" not in consent.scope and requested_scope != "general":
            return "BLOCK"
            
        return "ALLOW"
