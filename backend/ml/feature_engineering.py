import pandas as pd
from sklearn.preprocessing import StandardScaler
import torch
from torch.utils.data import TensorDataset, DataLoader
from typing import Tuple

class DiabetesFeatureEngineer:
    def __init__(self):
        self.scaler = StandardScaler()
        # Features required for diabetes risk prediction
        self.features = ['age', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'bmi', 'glucose', 'hba1c', 'cholesterol', 'creatinine']

    def fit_transform(self, df: pd.DataFrame) -> Tuple[torch.Tensor, torch.Tensor]:
        df = df.copy()
        df['gender'] = df['gender'].map({'male': 0, 'female': 1}).fillna(0)
        X = df[['gender'] + self.features].values
        X_scaled = self.scaler.fit_transform(X)
        y = df['diabetes'].values
        return torch.tensor(X_scaled, dtype=torch.float32), torch.tensor(y, dtype=torch.float32).unsqueeze(1)

    def transform(self, df: pd.DataFrame) -> Tuple[torch.Tensor, torch.Tensor]:
        df = df.copy()
        df['gender'] = df['gender'].map({'male': 0, 'female': 1}).fillna(0)
        X = df[['gender'] + self.features].values
        X_scaled = self.scaler.transform(X)
        y = df['diabetes'].values
        return torch.tensor(X_scaled, dtype=torch.float32), torch.tensor(y, dtype=torch.float32).unsqueeze(1)
        
    @staticmethod
    def create_dataloader(X: torch.Tensor, y: torch.Tensor, batch_size=32, shuffle=True) -> DataLoader:
        dataset = TensorDataset(X, y)
        return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)
