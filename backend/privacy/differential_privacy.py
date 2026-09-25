from typing import Tuple, Any
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import logging

class DPTrainerWrapper:
    """
    Wraps local PyTorch training to apply Differential Privacy (DP-SGD).
    This ensures that the model updates (gradients) do not memorize specific raw patient data.
    
    Protections provided:
    - Bounding the sensitivity: Gradients of individual records are clipped to `max_grad_norm`.
    - Obfuscation: Gaussian noise scaled by `noise_multiplier` is added to the aggregated gradients.
    
    LIMITATION: This does not guarantee absolute privacy. Repeated training rounds can still lead to privacy budget (epsilon) exhaustion.
    """
    def __init__(self, 
                 epsilon: float = 1.0, 
                 delta: float = 1e-5, 
                 max_grad_norm: float = 1.0, 
                 noise_multiplier: float = 1.0):
        """
        epsilon (float): The privacy budget. Lower is more private but less accurate.
        delta (float): The probability of the privacy guarantee failing. Should be less than 1/N.
        max_grad_norm (float): The maximum L2 norm of per-sample gradients.
        noise_multiplier (float): Amount of Gaussian noise to add to gradients.
        """
        self.epsilon = epsilon
        self.delta = delta
        self.max_grad_norm = max_grad_norm
        self.noise_multiplier = noise_multiplier
        
    def attach(self, model: nn.Module, optimizer: torch.optim.Optimizer, dataloader: DataLoader):
        """
        Attaches the Opacus PrivacyEngine to the PyTorch training loop.
        """
        try:
            from opacus import PrivacyEngine
            privacy_engine = PrivacyEngine()
            
            # make_private tracks gradients at the per-sample level, clips them, and adds noise.
            model, optimizer, dataloader = privacy_engine.make_private(
                module=model,
                optimizer=optimizer,
                data_loader=dataloader,
                noise_multiplier=self.noise_multiplier,
                max_grad_norm=self.max_grad_norm,
            )
            return model, optimizer, dataloader, privacy_engine
        except ImportError:
            logging.warning("Opacus not installed. Running without Differential Privacy guarantees.")
            return model, optimizer, dataloader, None
