from typing import Dict
import logging

class TrustManager:
    """
    Evaluates and tracks a dynamic trust score for each hospital in the FL network.
    Uses configurable thresholds to penalize malicious updates or consent violations,
    and can automatically reject or down-weight their global model contributions.
    """
    def __init__(self, initial_score: float = 1.0, threshold: float = 0.5):
        self.initial_score = initial_score
        self.threshold = threshold
        self.trust_scores: Dict[str, float] = {}
        
    def _ensure_client(self, client_id: str):
        if client_id not in self.trust_scores:
            self.trust_scores[client_id] = self.initial_score
            
    def record_anomaly(self, client_id: str):
        """Penalty for sending anomalous model updates (e.g., poisoning)."""
        self._ensure_client(client_id)
        self.trust_scores[client_id] = max(0.0, self.trust_scores[client_id] - 0.3)
        logging.warning(f"[TrustManager] {client_id} penalized for anomaly. Score: {self.trust_scores[client_id]:.2f}")
        
    def record_consent_violation(self, client_id: str):
        """Heavy penalty for consent compliance failures."""
        self._ensure_client(client_id)
        self.trust_scores[client_id] = max(0.0, self.trust_scores[client_id] - 0.5)
        logging.warning(f"[TrustManager] {client_id} penalized for consent violation. Score: {self.trust_scores[client_id]:.2f}")
        
    def record_successful_participation(self, client_id: str):
        """Reward for reliable participation and normal updates."""
        self._ensure_client(client_id)
        self.trust_scores[client_id] = min(1.0, self.trust_scores[client_id] + 0.05)
        
    def is_suspicious(self, client_id: str) -> bool:
        """Returns True if the client's score drops below the safe threshold."""
        self._ensure_client(client_id)
        return self.trust_scores[client_id] < self.threshold
        
    def get_weight_multiplier(self, client_id: str) -> float:
        """
        Returns a multiplier to down-weight updates from less trusted clients.
        If suspicious, weight is 0.0 (rejected). Otherwise, scale by the current score.
        """
        if self.is_suspicious(client_id):
            logging.error(f"[TrustManager] {client_id} is SUSPICIOUS. Updates will be rejected.")
            return 0.0
        return self.trust_scores[client_id]
