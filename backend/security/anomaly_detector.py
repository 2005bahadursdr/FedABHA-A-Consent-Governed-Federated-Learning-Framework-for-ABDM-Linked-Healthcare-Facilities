import numpy as np
from typing import List, Tuple

class AnomalyDetector:
    """
    Detects anomalous model updates from federated clients.
    Useful to prevent poisoning attacks and backdoor insertions.
    """
    def __init__(self, z_score_threshold: float = 1.15):
        # We use a lower z-score threshold (1.15) for small client pools (N=3 max z is 1.414)
        self.z_score_threshold = z_score_threshold
        
    def _compute_update_norm(self, parameters: List[np.ndarray]) -> float:
        """Computes the L2 norm of the entire parameter update."""
        squared_sum = sum(np.sum(np.square(layer)) for layer in parameters)
        return float(np.sqrt(squared_sum))
        
    def detect_anomalies(self, client_updates: List[Tuple[str, List[np.ndarray]]]) -> List[str]:
        """
        Analyzes a list of client updates and returns the IDs of anomalous clients.
        Uses z-score of the L2 norms of the updates.
        """
        if len(client_updates) < 3:
            # Need at least 3 clients for meaningful std deviation
            return []
            
        norms = [self._compute_update_norm(update) for _, update in client_updates]
        mean_norm = np.mean(norms)
        std_norm = np.std(norms)
        
        # Avoid division by zero
        if std_norm < 1e-8:
            return []
            
        anomalous_clients = []
        for i, norm in enumerate(norms):
            z_score = abs(norm - mean_norm) / std_norm
            if z_score > self.z_score_threshold:
                client_id = client_updates[i][0]
                anomalous_clients.append(client_id)
                
        return anomalous_clients
