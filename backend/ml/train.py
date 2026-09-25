import torch
import torch.nn as nn
import torch.optim as optim
from .model import DiabetesRiskModel

def train_one_epoch(model: nn.Module, train_loader, criterion, optimizer, device="cpu"):
    """
    Trains the model for one epoch. Used directly by FL clients.
    """
    model.train()
    model.to(device)
    running_loss = 0.0
    for X_batch, y_batch in train_loader:
        X_batch, y_batch = X_batch.to(device), y_batch.to(device)
        optimizer.zero_grad()
        outputs = model(X_batch)
        loss = criterion(outputs, y_batch)
        loss.backward()
        optimizer.step()
        running_loss += loss.item() * X_batch.size(0)
        
    return running_loss / len(train_loader.dataset)

def train_model(model, train_loader, val_loader=None, epochs=10, lr=0.01, device="cpu"):
    """
    Standard local training loop.
    """
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    for epoch in range(epochs):
        train_loss = train_one_epoch(model, train_loader, criterion, optimizer, device)
        print(f"Epoch {epoch+1}/{epochs} | Train Loss: {train_loss:.4f}")
    return model
