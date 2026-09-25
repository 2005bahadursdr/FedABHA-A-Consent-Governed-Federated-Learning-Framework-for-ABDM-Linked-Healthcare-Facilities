import flwr as fl
import torch
from collections import OrderedDict
from backend.ml.train import train_one_epoch
from backend.ml.evaluate import evaluate_model
import torch.nn as nn
import torch.optim as optim

class FlowerClient(fl.client.NumPyClient):
    """
    Flower client that trains a local PyTorch model.
    It never sends raw patient data to the server, only model parameters.
    """
    def __init__(self, model, train_loader, val_loader, config, device="cpu"):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.config = config
        self.device = device
        
        self.dp_model = None
        self.dp_optimizer = None
        self.dp_loader = None
        
    def get_parameters(self, config):
        # Extract model parameters to send to the server
        return [val.cpu().numpy() for _, val in self.model.state_dict().items()]

    def set_parameters(self, parameters):
        # Update local model with parameters received from the server
        params_dict = zip(self.model.state_dict().keys(), parameters)
        state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
        self.model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters, config):
        self.set_parameters(parameters)
        
        # Local training with DP
        epochs = config.get("epochs", self.config.get("epochs", 1))
        lr = config.get("learning_rate", self.config.get("learning_rate", 0.01))
        
        if self.dp_model is None:
            # Privacy hyperparameters can be passed via config from the server
            epsilon = config.get("dp_epsilon", self.config.get("dp_epsilon", 1.0))
            delta = config.get("dp_delta", self.config.get("dp_delta", 1e-5))
            max_grad_norm = config.get("dp_max_grad_norm", self.config.get("dp_max_grad_norm", 1.0))
            noise_multiplier = config.get("dp_noise_multiplier", self.config.get("dp_noise_multiplier", 1.0))
            
            from backend.privacy.differential_privacy import DPTrainerWrapper
            dp_wrapper = DPTrainerWrapper(epsilon, delta, max_grad_norm, noise_multiplier)
            
            optimizer = optim.Adam(self.model.parameters(), lr=lr)
            
            # Model needs to be in train mode before attaching Opacus
            self.model.train()
    
            # Attach privacy engine
            self.dp_model, self.dp_optimizer, self.dp_loader, _ = dp_wrapper.attach(self.model, optimizer, self.train_loader)
        else:
            # Update learning rate and set to train mode
            for param_group in self.dp_optimizer.param_groups:
                param_group['lr'] = lr
            self.dp_model.train()
            
        criterion = nn.BCEWithLogitsLoss()
        
        # Train securely
        for epoch in range(epochs):
            loss = train_one_epoch(self.dp_model, self.dp_loader, criterion, self.dp_optimizer, self.device)
            
        out_params = self.get_parameters(config={})
        
        if self.config.get("simulate_poisoning", False):
            print(f"[ATTACK] Simulating model poisoning...")
            out_params = [p * 50.0 for p in out_params]
            
        return out_params, len(self.dp_loader.dataset), {}

    def evaluate(self, parameters, config):
        self.set_parameters(parameters)
        metrics = evaluate_model(self.model, self.val_loader, self.device)
        
        # Flower ConfigRecord does not support nested lists, so remove or stringify confusion_matrix
        if "confusion_matrix" in metrics:
            metrics["confusion_matrix_str"] = str(metrics.pop("confusion_matrix"))
            
        # Flower expects float for loss, we map accuracy to something useful or just return 0.0 as loss if we don't compute test loss
        loss = 0.0 
        return loss, len(self.val_loader.dataset), metrics
