import json
import logging
import uuid
import os
from datetime import datetime
from typing import Dict, Any, List

class LocalBlockchainClient:
    """
    A local development client simulating smart contract interactions on Ethereum / Hyperledger.
    Interacts with the smart contract defined in blockchain/contracts/ConsentAudit.sol.
    """
    def __init__(self, ledger_file: str = "local_ledger.json"):
        self.ledger_file = ledger_file
        self.contract_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../blockchain/contracts/ConsentAudit.sol"))
        self.chain: List[Dict[str, Any]] = []
        self._load_ledger()

    def _load_ledger(self):
        if os.path.exists(self.ledger_file):
            try:
                with open(self.ledger_file, "r") as f:
                    self.chain = json.load(f)
            except Exception:
                self.chain = []

    def submit_transaction(self, event_type: str, payload_hash: str, metadata: Dict[str, Any]) -> str:
        """
        Submits an audit event matching ConsentAudit.sol's logAuditEvent interface.
        Returns a transaction ID.
        """
        tx_id = f"tx-{uuid.uuid4().hex[:8]}"
        transaction = {
            "tx_id": tx_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": event_type,
            "payload_hash": payload_hash,
            "metadata": metadata,
            "contract": "ConsentAudit.sol"
        }
        
        self.chain.insert(0, transaction)
        self.chain = self.chain[:100]
        
        try:
            with open(self.ledger_file, "w") as f:
                json.dump(self.chain, f, indent=4)
        except IOError as e:
            logging.error(f"Failed to write to local ledger: {e}")
            
        logging.info(f"[Blockchain Smart Contract - ConsentAudit.sol] Committed {event_type} event. TX ID: {tx_id}")
        return tx_id

