import os
import sys
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

class InMemoryConsentCollection:
    def __init__(self):
        self._data = {}

    def count_documents(self, filter_dict):
        pid = filter_dict.get("patient_id")
        if pid:
            return 1 if pid in self._data else 0
        return len(self._data)

    def find(self, filter_dict=None):
        if not filter_dict:
            return list(self._data.values())
        pid_in = filter_dict.get("patient_id", {}).get("$in")
        if pid_in:
            return [v for k, v in self._data.items() if k in pid_in]
        return list(self._data.values())

    def find_one(self, filter_dict):
        pid = filter_dict.get("patient_id")
        if pid and pid in self._data:
            return self._data[pid]
        return None

    def update_one(self, filter_dict, update_dict, upsert=False):
        pid = filter_dict.get("patient_id")
        if not pid:
            return
        doc = self._data.get(pid, {})
        if "$set" in update_dict:
            doc.update(update_dict["$set"])
        self._data[pid] = doc

in_memory_collection = InMemoryConsentCollection()
_mongo_collection = None
_initialized = False

def init_db():
    global _mongo_collection, _initialized
    if _initialized:
        return
    _initialized = True
    try:
        from pymongo import MongoClient
        
        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=2500,
            connectTimeoutMS=2500,
            tlsAllowInvalidCertificates=True
        )
        # Test connection ping
        client.admin.command('ping')
        db = client["fedabha"]
        _mongo_collection = db["consent_policies"]
        print("[Database] Successfully connected to MongoDB Atlas.")
    except Exception as e:
        print(f"[Database Warning] Remote MongoDB unavailable ({e}). Using resilient In-Memory Store.")
        _mongo_collection = None

class ResilientCollectionProxy:
    def count_documents(self, filter_dict):
        global _mongo_collection
        if _mongo_collection is not None:
            try:
                return _mongo_collection.count_documents(filter_dict)
            except Exception:
                pass
        return in_memory_collection.count_documents(filter_dict)

    def find(self, filter_dict=None):
        global _mongo_collection
        if _mongo_collection is not None:
            try:
                return list(_mongo_collection.find(filter_dict or {}))
            except Exception:
                pass
        return in_memory_collection.find(filter_dict)

    def find_one(self, filter_dict):
        global _mongo_collection
        if _mongo_collection is not None:
            try:
                res = _mongo_collection.find_one(filter_dict)
                if res is not None:
                    return res
            except Exception:
                pass
        return in_memory_collection.find_one(filter_dict)

    def update_one(self, filter_dict, update_dict, upsert=False):
        global _mongo_collection
        if _mongo_collection is not None:
            try:
                res = _mongo_collection.update_one(filter_dict, update_dict, upsert=upsert)
                # Also mirror into in-memory store
                in_memory_collection.update_one(filter_dict, update_dict, upsert=upsert)
                return res
            except Exception:
                pass
        return in_memory_collection.update_one(filter_dict, update_dict, upsert=upsert)

resilient_proxy = ResilientCollectionProxy()

def get_consent_collection():
    if not _initialized:
        init_db()
    return resilient_proxy
