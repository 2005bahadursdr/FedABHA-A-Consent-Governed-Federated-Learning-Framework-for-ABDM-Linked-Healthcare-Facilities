"""
Flower FL Client for hospital_B.
"""
import flwr as fl
import os
import json
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from backend.ml.model import DiabetesRiskModel
from backend.federated_learning.client import FlowerClient
from dataset_loader import get_dataloader

def start_client():
    print(f"Starting FL Client for hospital_B...")
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    
    with open(config_path, 'r') as f:
        config = json.load(f)
        
    # Load dataset
    train_loader, _ = get_dataloader(config_path)
    
    # Normally we'd have a separate val_loader, but for prototype we can use train_loader or a split
    val_loader, _ = get_dataloader(config_path)
    
    model = DiabetesRiskModel(input_dim=10)
    
    # Initialize Flower client
    fl_client = FlowerClient(model, train_loader, val_loader, config)
    
    # Start Flower client
    fl.client.start_numpy_client(
        server_address="127.0.0.1:8080",
        client=fl_client
    )

if __name__ == "__main__":
    start_client()
