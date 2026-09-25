import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

import flwr as fl
import argparse
from backend.federated_learning.strategy import get_strategy

def start_server(num_rounds: int = 3):
    """
    Starts the Flower Federated Learning Server.
    """
    print(f"Starting Flower Server for {num_rounds} FL rounds...")
    
    strategy = get_strategy(num_rounds)
    
    # Start the server on port 8080
    fl.server.start_server(
        server_address="0.0.0.0:8080",
        config=fl.server.ServerConfig(num_rounds=num_rounds),
        strategy=strategy
    )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Flower Server")
    parser.add_argument("--rounds", type=int, default=5, help="Number of FL rounds")
    args = parser.parse_args()
    
    start_server(num_rounds=args.rounds)
