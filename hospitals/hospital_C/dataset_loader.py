import pandas as pd
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
        
        # Initialize consent management and filter records
        from backend.consent.mock_initializer import get_initialized_consent_manager
        from backend.consent.consent_validator import ConsentValidator
        
        consent_manager, consent_stats = get_initialized_consent_manager(self.df)
        
        valid_indices = []
        for idx, row in self.df.iterrows():
            patient_id = row['patient_id']
            consent = consent_manager.get_consent_for_patient(patient_id)
            result = ConsentValidator.evaluate(consent, requested_purpose="training", requested_scope="diabetes")
            if result == "ALLOW":
                valid_indices.append(idx)
                
        # Filter dataset based on consent ALLOW result
        original_len = len(self.df)
        self.df = self.df.loc[valid_indices].reset_index(drop=True)
        print(f"[Consent Filter] Allowed {len(valid_indices)} records out of total")
        
        # Post stats to API
        try:
            import requests, os
            hosp_id = os.path.basename(os.path.dirname(os.path.abspath(__file__)))
            requests.post("http://127.0.0.1:8000/api/fl/hospital_stats", json={
                "hospital_id": hosp_id,
                "data_size": len(self.df),
                "approved": consent_stats["approved"],
                "blocked": consent_stats["blocked"],
                "revoked": consent_stats["revoked"]
            })
        except:
            pass
        
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
