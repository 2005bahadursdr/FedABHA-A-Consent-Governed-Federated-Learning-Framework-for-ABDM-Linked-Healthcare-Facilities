import flwr as fl
import requests
import time
from typing import List, Tuple, Dict, Optional, Union
from flwr.common import FitRes, Parameters, Scalar
from flwr.server.client_proxy import ClientProxy
from .aggregation import aggregate_metrics
from backend.security.anomaly_detector import AnomalyDetector
from backend.security.trust_evaluation import TrustManager
from backend.blockchain.audit_service import AuditService

class CustomSecureFedAvg(fl.server.strategy.FedAvg):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.anomaly_detector = AnomalyDetector()
        self.trust_manager = TrustManager()
        self.audit_service = AuditService()
        
    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        
        # 1. Prepare updates for anomaly detection
        # Flower parameters are serialized. We need to deserialize them to numpy arrays for the detector.
        client_updates = []
        for client, fit_res in results:
            # fl.common.parameters_to_ndarrays deserializes the protobuf Parameters
            ndarrays = fl.common.parameters_to_ndarrays(fit_res.parameters)
            client_updates.append((client.cid, ndarrays))
            
        anomalous_clients = self.anomaly_detector.detect_anomalies(client_updates)
        anomalies_detected = []
        
        trusted_results = []
        trust_scores = {}
        
        # Initialize trust for new clients
        for client, _ in results:
            if client.cid not in self.trust_manager.trust_scores:
                self.trust_manager.trust_scores[client.cid] = 1.0
                
        for client, fit_res in results:
            cid = client.cid
            is_anomaly = cid in anomalous_clients
            
            if is_anomaly:
                anomalies_detected.append({
                    "id": cid, 
                    "round": server_round, 
                    "zScore": 2.5, # Dummy z-score since detect_anomalies just returns list of IDs
                    "status": "Flagged"
                })
                self.trust_manager.record_anomaly(cid)
                self.audit_service.log_anomaly_detected(cid, 2.5)
                self.audit_service.log_trust_score_changed(cid, self.trust_manager.trust_scores[cid], "Anomaly detected")
            else:
                self.trust_manager.record_successful_participation(cid)
            
            trust_scores[cid] = self.trust_manager.trust_scores[cid]
            
            # Filter if trust is too low (simulating Secure Aggregation drop)
            if self.trust_manager.is_suspicious(cid):
                print(f"[SECURITY] Dropping client {cid} from aggregation due to low trust.")
                self.audit_service.log_training_blocked(cid, "Trust score below threshold")
            else:
                trusted_results.append((client, fit_res))
                
        # 2. Secure Aggregation via FedAvg
        parameters_aggregated, metrics_aggregated = super().aggregate_fit(server_round, trusted_results, failures)
        
        # Save the global model
        if parameters_aggregated is not None:
            try:
                import os, torch
                from backend.ml.model import DiabetesRiskModel
                ndarrays = fl.common.parameters_to_ndarrays(parameters_aggregated)
                model = DiabetesRiskModel(input_dim=10)
                
                # Create a strict=False dictionary mapping or zip
                params_dict = zip(model.state_dict().keys(), ndarrays)
                state_dict = {k: torch.tensor(v) for k, v in params_dict}
                model.load_state_dict(state_dict, strict=True)
                
                save_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/global"))
                os.makedirs(save_dir, exist_ok=True)
                torch.save(model.state_dict(), os.path.join(save_dir, "global_model.pt"))
                print(f"[SERVER] Saved global model for round {server_round}")
            except Exception as e:
                print(f"[SERVER] Could not save global model: {e}")
        
        # We push to the API in aggregate_evaluate, when we have accuracy.
        # But we can store anomalies and trust scores temporarily on self.
        self._current_anomalies = anomalies_detected
        self._current_trust = trust_scores
        
        return parameters_aggregated, metrics_aggregated

    def aggregate_evaluate(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, fl.common.EvaluateRes]],
        failures: List[Union[Tuple[ClientProxy, fl.common.EvaluateRes], BaseException]],
    ) -> Tuple[Optional[float], Dict[str, Scalar]]:
        
        loss, metrics = super().aggregate_evaluate(server_round, results, failures)
        
        accuracy = round(metrics.get("accuracy", 0.0) * 100, 2) if metrics else 0.0
        raw_f1 = metrics.get("f1_score", 0.0) if metrics else 0.0
        f1 = round(raw_f1 * 100 if raw_f1 <= 1.0 else raw_f1, 2)
        
        print(f"[SERVER] Round {server_round} Complete -> Global Accuracy: {accuracy}%, F1 Score: {f1}%")
        
        # We don't have the global model hash here easily, so we just use a placeholder
        self.audit_service.log_fl_round_completed(server_round, "global_model_hash_placeholder")
        
        # 3. Post metrics to FastAPI
        payload = {
            "round": server_round,
            "globalAccuracy": float(accuracy),
            "f1Score": float(f1),
            "anomalies": getattr(self, "_current_anomalies", []),
            "trustScores": getattr(self, "_current_trust", {})
        }
        
        try:
            requests.post("http://127.0.0.1:8000/api/fl/webhook", json=payload)
        except Exception as e:
            print(f"[API WARN] Could not push to webhook: {e}")
            
        return loss, metrics

def get_strategy(num_rounds: int = 3):
    strategy = CustomSecureFedAvg(
        fraction_fit=1.0,           
        fraction_evaluate=1.0,      
        min_fit_clients=1,          
        min_evaluate_clients=1,     
        min_available_clients=1,    
        evaluate_metrics_aggregation_fn=aggregate_metrics,
        on_fit_config_fn=lambda server_round: {"epochs": 2, "learning_rate": 0.05}
    )
    return strategy
