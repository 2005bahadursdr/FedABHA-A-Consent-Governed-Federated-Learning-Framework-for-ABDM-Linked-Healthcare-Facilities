import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from ml.model import DiabetesRiskModel
from ml.train import train_one_epoch
from ml.evaluate import evaluate_model
from privacy.differential_privacy import DPTrainerWrapper
import torch.optim as optim

def main():
    print("Testing ML without DP")
    X = torch.randn(100, 10)
    y = torch.randint(0, 2, (100,)).float()
    dataset = TensorDataset(X, y)
    loader = DataLoader(dataset, batch_size=10)
    
    model = DiabetesRiskModel()
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    
    try:
        train_one_epoch(model, loader, criterion, optimizer)
        print("Train successful")
    except Exception as e:
        print("Train Error:", e)
        
    try:
        metrics = evaluate_model(model, loader)
        print("Eval successful:", metrics)
    except Exception as e:
        print("Eval Error:", e)

    print("\nTesting ML with DP")
    model = DiabetesRiskModel()
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    dp_wrapper = DPTrainerWrapper()
    dp_model, dp_optimizer, dp_loader, _ = dp_wrapper.attach(model, optimizer, loader)
    try:
        train_one_epoch(dp_model, dp_loader, criterion, dp_optimizer)
        print("DP Train successful")
    except Exception as e:
        print("DP Train Error:", e)

if __name__ == '__main__':
    main()
