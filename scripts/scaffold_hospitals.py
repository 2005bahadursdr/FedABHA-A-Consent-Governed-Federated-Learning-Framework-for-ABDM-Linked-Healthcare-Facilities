import os
import json

hospitals = ['hospital_A', 'hospital_B', 'hospital_C']

for hosp in hospitals:
    os.makedirs(f'hospitals/{hosp}', exist_ok=True)
    
    config = {
        'hospital_id': hosp,
        'dataset_path': f'../../data/hospitals/{hosp}.csv',
        'batch_size': 32,
        'learning_rate': 0.01,
        'epochs': 5
    }
    with open(f'hospitals/{hosp}/config.json', 'w') as f:
        json.dump(config, f, indent=4)
        
    with open(f'hospitals/{hosp}/dataset_loader.py', 'w') as f:
        f.write('''import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import StandardScaler
import json

class HospitalDataset(Dataset):
    def __init__(self, csv_path, scaler=None):
        self.df = pd.read_csv(csv_path)
        self.features = ['age', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'bmi', 'glucose', 'hba1c', 'cholesterol', 'creatinine']
        self.df['gender'] = self.df['gender'].map({'male': 0, 'female': 1}).fillna(0)
        self.targets = ['diabetes']
        
        X = self.df[['gender'] + self.features].values
        y = self.df[self.targets].values
        
        if scaler is None:
            self.scaler = StandardScaler()
            self.X = self.scaler.fit_transform(X)
        else:
            self.scaler = scaler
            self.X = self.scaler.transform(X)
            
        self.y = y
        
    def __len__(self):
        return len(self.X)
        
    def __getitem__(self, idx):
        return torch.tensor(self.X[idx], dtype=torch.float32), torch.tensor(self.y[idx], dtype=torch.float32)

def get_dataloader(config_path):
    import os
    with open(config_path, 'r') as f:
        config = json.load(f)
    base_dir = os.path.dirname(os.path.abspath(config_path))
    dataset_path = os.path.join(base_dir, config['dataset_path'])
    dataset = HospitalDataset(dataset_path)
    loader = DataLoader(dataset, batch_size=config['batch_size'], shuffle=True)
    return loader, dataset.scaler
''')

    with open(f'hospitals/{hosp}/local_train.py', 'w') as f:
        f.write(f'''import torch
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
        
    print(f"[{{config['hospital_id']}}] Starting local training...")
    train_loader, _ = get_dataloader(config_path)
    
    model = DiabetesRiskModel(input_dim=10)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=config['learning_rate'])
    
    for epoch in range(config['epochs']):
        loss = train_one_epoch(model, train_loader, criterion, optimizer)
        print(f"[{{config['hospital_id']}}] Epoch {{epoch+1}}/{{config['epochs']}}, Loss: {{loss:.4f}}")
        
    metrics = evaluate_model(model, train_loader)
    print(f"[{{config['hospital_id']}}] Evaluation Metrics: {{metrics}}")
    
    os.makedirs(f"../../models/local/{hosp}", exist_ok=True)
    torch.save(model.state_dict(), f"../../models/local/{hosp}/model.pt")
    print(f"[{{config['hospital_id']}}] Training completed. Model saved.")
    
if __name__ == "__main__":
    train_local_model()
''')

    with open(f'hospitals/{hosp}/client.py', 'w') as f:
        f.write(f'''"""
Flower FL Client for {hosp}.
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
    print(f"Starting FL Client for {hosp}...")
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
''')
