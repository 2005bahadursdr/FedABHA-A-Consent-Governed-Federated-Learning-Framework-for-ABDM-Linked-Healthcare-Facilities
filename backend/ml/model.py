import torch
import torch.nn as nn

class DiabetesRiskModel(nn.Module):
    """
    Binary classification model for Diabetes Risk.
    Designed for Federated Learning (Flower compatible).
    """
    def __init__(self, input_dim=10):
        super(DiabetesRiskModel, self).__init__()
        self.fc1 = nn.Linear(input_dim, 32)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(0.2)
        
        self.fc2 = nn.Linear(32, 16)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(0.2)
        
        # 1 output for binary classification (logits)
        self.out = nn.Linear(16, 1)
        
    def forward(self, x):
        x = self.dropout1(self.relu1(self.fc1(x)))
        x = self.dropout2(self.relu2(self.fc2(x)))
        x = self.out(x)
        return x
