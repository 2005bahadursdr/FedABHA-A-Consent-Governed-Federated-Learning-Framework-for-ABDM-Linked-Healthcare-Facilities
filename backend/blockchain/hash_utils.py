import hashlib
import json
from typing import Any

def hash_data(data: Any) -> str:
    """
    Creates a SHA-256 hash of the input data to ensure privacy.
    Dictionaries are sorted by key to guarantee deterministic hashes.
    """
    if isinstance(data, dict):
        data_str = json.dumps(data, sort_keys=True)
    else:
        data_str = str(data)
    
    return hashlib.sha256(data_str.encode('utf-8')).hexdigest()

def hash_abha(abha_number: str) -> str:
    """
    Hashes a plaintext ABHA number for privacy-preserving auditing.
    Never store ABHA numbers in plaintext on the blockchain.
    """
    # In production, a secure salt would be appended here.
    return hash_data(abha_number)
