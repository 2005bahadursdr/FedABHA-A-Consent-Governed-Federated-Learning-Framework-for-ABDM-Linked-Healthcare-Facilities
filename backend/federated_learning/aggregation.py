from typing import List, Tuple, Dict, Optional
import flwr as fl
from flwr.common import Metrics

def aggregate_metrics(metrics: List[Tuple[int, Metrics]]) -> Metrics:
    """
    Aggregates evaluation metrics (like accuracy, precision, etc.) across all clients.
    """
    if not metrics:
        return {}
        
    total_examples = sum([num_examples for num_examples, _ in metrics])
    
    aggregated_metrics = {}
    
    # Extract keys from the first client's metrics
    metric_keys = metrics[0][1].keys()
    
    for key in metric_keys:
        # Skip non-numeric metrics
        if isinstance(metrics[0][1][key], str) or key == 'confusion_matrix':
            continue 
            
        # Weighted average of the metric
        weighted_sum = sum([num_examples * m[key] for num_examples, m in metrics if key in m])
        aggregated_metrics[key] = weighted_sum / total_examples
        
    return aggregated_metrics
