from .consent_manager import ConsentManager
from .consent_validator import ConsentValidator

class RealtimeConsentEnforcer:
    """
    Facade for realtime consent evaluation.
    Called by hospital data loaders or federated API before permitting data access.
    """
    def __init__(self, manager: ConsentManager):
        self.manager = manager
        self.validator = ConsentValidator()
        
    def check_access(self, patient_id: str, requested_purpose: str, requested_scope: str) -> str:
        """
        Evaluates the patient's active consent artifact against the request context.
        Returns 'ALLOW' or 'BLOCK'.
        """
        consent = self.manager.get_consent_for_patient(patient_id)
        return self.validator.evaluate(consent, requested_purpose, requested_scope)
