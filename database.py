from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

# MongoDB URI from .env
MONGO_URI = os.getenv("MONGO_URI")

# Connect MongoDB
client = MongoClient(MONGO_URI)

# Create separate database for Priva
db = client["priva_db"]

# Collections
users_collection = db["users"]
friends_collection = db["friends"]
messages_collection = db["messages"]

# Check connection
try:
    client.admin.command("ping")
    print("✅ MongoDB Connected Successfully (Priva)")
except Exception as e:
    print("❌ MongoDB Connection Failed")
    print(e)