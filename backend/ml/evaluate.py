import torch
import torch.nn as nn
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from typing import Dict, Any

def evaluate_model(model: nn.Module, test_loader, device="cpu") -> Dict[str, Any]:
    """
    Evaluates the model on test data, returning standard ML metrics.
    Works for binary classification (Diabetes Risk).
    """
    model.eval()
    model.to(device)
    all_preds = []
    all_targets = []
    
    with torch.no_grad():
        for X_batch, y_batch in test_loader:
            X_batch = X_batch.to(device)
            outputs = model(X_batch)
            probs = torch.sigmoid(outputs)
            # Binary classification threshold = 0.5
            preds = (probs >= 0.5).float()
            
            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(y_batch.numpy())
            
    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    
    metrics = {
        'accuracy': float(accuracy_score(all_targets, all_preds)),
        'precision': float(precision_score(all_targets, all_preds, zero_division=0)),
        'recall': float(recall_score(all_targets, all_preds, zero_division=0)),
        'f1_score': float(f1_score(all_targets, all_preds, zero_division=0)),
        'confusion_matrix': confusion_matrix(all_targets, all_preds).tolist()
    }
    return metrics
