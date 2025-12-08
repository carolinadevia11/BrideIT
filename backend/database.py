import os
from copy import deepcopy
from datetime import datetime
from types import SimpleNamespace
from typing import Any, Dict, Iterable, List, Optional

import certifi
import pymongo
import gridfs
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()


class InMemoryCursor:
    def __init__(self, documents: List[Dict[str, Any]]):
        self._documents = documents

    def sort(self, key: str, direction: int = 1) -> "InMemoryCursor":
        reverse = direction == -1

        def sort_key(doc: Dict[str, Any]):
            value = InMemoryCollection._get_value(doc, key)
            if isinstance(value, datetime):
                return value
            return value or ""

        sorted_docs = sorted(self._documents, key=sort_key, reverse=reverse)
        return InMemoryCursor(sorted_docs)

    def __iter__(self):
        return iter(self._documents)

    def __len__(self):
        return len(self._documents)


# In-memory database for development/testing
class InMemoryCollection:
    def __init__(self):
        self.data: List[Dict[str, Any]] = []
        self._counter = 1

    @staticmethod
    def _normalize(value: Any) -> Any:
        if isinstance(value, ObjectId):
            return str(value)
        return value

    @staticmethod
    def _get_value(document: Dict[str, Any], key: str) -> Any:
        parts = key.split(".")
        current: Any = document
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        return current

    @staticmethod
    def _set_value(document: Dict[str, Any], key: str, value: Any):
        parts = key.split(".")
        current = document
        for part in parts[:-1]:
            if part not in current or not isinstance(current[part], dict):
                current[part] = {}
            current = current[part]
        current[parts[-1]] = value

    def _matches(self, document: Dict[str, Any], query: Optional[Dict[str, Any]] = None) -> bool:
        if not query:
            return True

        for key, value in query.items():
            if key == "$or":
                if not any(self._matches(document, condition) for condition in value):
                    return False
                continue

            expected = self._normalize(value)
            actual = self._normalize(self._get_value(document, key))
            if actual != expected:
                return False

        return True

    def insert_one(self, document: Dict[str, Any]):
        doc_copy = deepcopy(document)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(self._counter)
            self._counter += 1
        self.data.append(doc_copy)
        return SimpleNamespace(inserted_id=doc_copy["_id"])

    def find_one(self, query: Optional[Dict[str, Any]] = None):
        for doc in self.data:
            if self._matches(doc, query):
                return doc
        return None
    
    def find(self, query: Optional[Dict[str, Any]] = None) -> InMemoryCursor:
        matched = [doc for doc in self.data if self._matches(doc, query)]
        return InMemoryCursor(matched)

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        doc = self.find_one(query)
        if not doc:
            return SimpleNamespace(matched_count=0, modified_count=0)

        modified = False

        if "$set" in update:
            for key, value in update["$set"].items():
                self._set_value(doc, key, value)
            modified = True

        if "$push" in update:
            for key, value in update["$push"].items():
                current = self._get_value(doc, key)
                if current is None:
                    self._set_value(doc, key, [value])
                else:
                    current.append(value)
            modified = True

        return SimpleNamespace(matched_count=1, modified_count=int(modified))

    def update_many(self, query: Dict[str, Any], update: Dict[str, Any]):
        matched = 0
        modified = 0
        for doc in self.data:
            if not self._matches(doc, query):
                continue
            matched += 1
            if "$set" in update:
                for key, value in update["$set"].items():
                    self._set_value(doc, key, value)
                modified += 1
        return SimpleNamespace(matched_count=matched, modified_count=modified)
    
    def delete_one(self, query: Dict[str, Any]):
        doc = self.find_one(query)
        if doc:
            self.data.remove(doc)
            return SimpleNamespace(deleted_count=1)
        return SimpleNamespace(deleted_count=0)


class InMemoryDB:
    def __init__(self):
        self.families = InMemoryCollection()
        self.users = InMemoryCollection()
        self.events = InMemoryCollection()
        self.change_requests = InMemoryCollection()
        self.conversations = InMemoryCollection()
        self.messages = InMemoryCollection()
        self.expenses = InMemoryCollection()
        self.documents = InMemoryCollection()
        self.document_folders = InMemoryCollection()
        # Mock GridFS for in-memory DB (basic placeholder)
        self.fs = SimpleNamespace(put=lambda x, **y: "mock_file_id", get=lambda x: None, delete=lambda x: None)


try:
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("MONGODB_URI not found in environment variables - using in-memory storage")
        db = InMemoryDB()
        fs = db.fs
    else:
        client = pymongo.MongoClient(
            mongo_uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000  # 5 second timeout
        )
        db = client.bridge
        fs = gridfs.GridFS(db)
        client.admin.command('ismaster')
        print("✅ DB connection successful")
except Exception as e:
    print(f"⚠️  DB connection failed: {e}")
    print("🔄 Running in development mode with in-memory database")
    db = InMemoryDB()
    fs = db.fs
