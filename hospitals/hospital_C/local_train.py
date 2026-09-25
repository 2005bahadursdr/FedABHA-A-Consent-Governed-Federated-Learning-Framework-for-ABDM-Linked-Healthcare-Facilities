import torch
import torch.nn as nn
import torch.optim as optim
import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from backend.ml.model import DiabetesRiskModel
from backend.ml.train import train_one_epoch
from backend.ml.evaluate import evaluate_model
from dataset_loader import get_dataloader

def train_local_model(config_path=None):
    if config_path is None:
        config_path = os.path.join(os.path.dirname(__file__), "config.json")
    with open(config_path, 'r') as f:
        config = json.load(f)
        
    print(f"[{config['hospital_id']}] Starting local training...")
    train_loader, _ = get_dataloader(config_path)
    
    model = DiabetesRiskModel(input_dim=10)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=config['learning_rate'])
    
    for epoch in range(config['epochs']):
        loss = train_one_epoch(model, train_loader, criterion, optimizer)
        print(f"[{config['hospital_id']}] Epoch {epoch+1}/{config['epochs']}, Loss: {loss:.4f}")
        
    metrics = evaluate_model(model, train_loader)
    print(f"[{config['hospital_id']}] Evaluation Metrics: {metrics}")
    
    os.makedirs(f"../../models/local/hospital_C", exist_ok=True)
    torch.save(model.state_dict(), f"../../models/local/hospital_C/model.pt")
    print(f"[{config['hospital_id']}] Training completed. Model saved.")
    
if __name__ == "__main__":
    train_local_model()
