import os
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

load_dotenv()

mongo_uri = os.getenv("MONGODB_URI")
client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
db = client.bridge

def check_users():
    print("Checking users in database...")
    users = list(db.users.find({}, {"email": 1, "password": 1, "firstName": 1, "lastName": 1, "role": 1, "_id": 0}))
    print(f"Found {len(users)} users.")
    for user in users:
        print(f"User: {user['email']}, Name: {user.get('firstName', '')} {user.get('lastName', '')}, Role: {user.get('role', 'user')}")
        # Print hashed password length to verify it looks like a hash
        pwd = user.get('password', '')
        print(f"  Password hash (first 10 chars): {pwd[:10]}... (Total length: {len(pwd)})")

if __name__ == "__main__":
    check_users()