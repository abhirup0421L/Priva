from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from datetime import datetime
from database import users_collection, friends_collection, messages_collection
from auth import send_otp, hash_password, verify_password, create_token
from websocket_manager import manager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmailRequest(BaseModel):
    email: EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    otp: str
    user_id: str
    password: str


class LoginRequest(BaseModel):
    user_id: str
    password: str


class FriendRequest(BaseModel):
    user_id: str
    friend_id: str


class MessageRequest(BaseModel):
    sender_id: str
    receiver_id: str
    text: str


@app.post("/send-otp")
def send_signup_otp(data: EmailRequest):
    existing_user = users_collection.find_one({"email": data.email})

    if existing_user and existing_user.get("verified") == True:
        return {
            "error": "This email is already registered. Please login with your account."
        }

    send_otp(data.email)

    return {
        "message": "OTP sent successfully"
    }


@app.post("/signup")
def signup(data: SignupRequest):
    user = users_collection.find_one({"email": data.email})

    if not user:
        return {"error": "OTP not requested"}

    if user.get("otp") != data.otp:
        return {"error": "Invalid OTP"}

    if user.get("otp_expiry") < datetime.utcnow():
        return {"error": "OTP expired"}

    if users_collection.find_one({"user_id": data.user_id}):
        return {"error": "User ID already exists"}

    users_collection.update_one(
        {"email": data.email},
        {
            "$set": {
                "user_id": data.user_id,
                "password": hash_password(data.password),
                "verified": True,
                "online": False,
                "last_seen": datetime.utcnow(),
            },
            "$unset": {"otp": "", "otp_expiry": ""},
        },
    )

    return {"message": "Signup successful"}


@app.post("/login")
def login(data: LoginRequest):
    user = users_collection.find_one({"user_id": data.user_id})

    if not user:
        return {"error": "User not found"}

    if not verify_password(data.password, user["password"]):
        return {"error": "Wrong password"}

    users_collection.update_one(
        {"user_id": data.user_id},
        {"$set": {"online": True, "last_seen": datetime.utcnow()}},
    )

    token = create_token(data.user_id)

    return {
        "message": "Login successful",
        "token": token,
        "user_id": data.user_id,
    }


@app.post("/logout/{user_id}")
def logout(user_id: str):
    users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"online": False, "last_seen": datetime.utcnow()}},
    )

    messages_collection.delete_many({
        "$or": [
            {"sender_id": user_id, "read": True},
            {"receiver_id": user_id, "read": True},
        ]
    })

    return {"message": "Logged out"}


@app.get("/search-user/{user_id}")
def search_user(user_id: str):
    user = users_collection.find_one(
        {"user_id": user_id},
        {"_id": 0, "user_id": 1, "online": 1},
    )

    if not user:
        return {"error": "User not found"}

    return user


@app.post("/add-friend")
def add_friend(data: FriendRequest):
    user_id = data.user_id.strip()
    friend_id = data.friend_id.strip()

    if user_id == friend_id:
        return {"error": "You cannot add yourself"}

    user = users_collection.find_one({"user_id": user_id})
    friend = users_collection.find_one({"user_id": friend_id})

    if not user:
        return {"error": "Your account not found"}

    if not friend:
        return {"error": "Friend not found"}

    exists = friends_collection.find_one({
        "$or": [
            {"user1": user_id, "user2": friend_id},
            {"user1": friend_id, "user2": user_id},
        ]
    })

    if exists:
        return {"error": "Already friends"}

    friends_collection.insert_one({
        "user1": user_id,
        "user2": friend_id,
        "created_at": datetime.utcnow(),
    })

    return {"message": "Friend added"}


@app.get("/friends/{user_id}")
def get_friends(user_id: str):
    user_id = user_id.strip()

    friends = friends_collection.find({
        "$or": [
            {"user1": user_id},
            {"user2": user_id}
        ]
    })

    result = []
    added = set()

    for f in friends:
        if f["user1"] == user_id:
            friend_id = f["user2"]
        else:
            friend_id = f["user1"]

        # stop showing yourself
        if friend_id == user_id:
            continue

        # stop duplicates
        if friend_id in added:
            continue

        friend_user = users_collection.find_one({"user_id": friend_id})

        if friend_user:
            result.append({
                "user_id": friend_id,
                "online": friend_user.get("online", False),
            })
            added.add(friend_id)

    return result


@app.get("/messages/{user1}/{user2}")
def get_messages(user1: str, user2: str):
    messages = list(messages_collection.find({
        "$or": [
            {"sender_id": user1, "receiver_id": user2},
            {"sender_id": user2, "receiver_id": user1},
        ]
    }).sort("created_at", 1))

    messages_collection.update_many(
        {"sender_id": user2, "receiver_id": user1},
        {"$set": {"read": True}},
    )

    result = []

    for m in messages:
        result.append({
            "sender_id": m["sender_id"],
            "receiver_id": m["receiver_id"],
            "text": m["text"],
            "read": m["read"],
            "created_at": str(m["created_at"]),
        })

    return result


@app.post("/send-message")
async def send_message(data: MessageRequest):
    message = {
        "sender_id": data.sender_id,
        "receiver_id": data.receiver_id,
        "text": data.text,
        "read": False,
        "created_at": datetime.utcnow(),
    }

    messages_collection.insert_one(message)

    await manager.send_personal_message(data.receiver_id, {
        "sender_id": data.sender_id,
        "receiver_id": data.receiver_id,
        "text": data.text,
    })

    return {"message": "Message sent"}


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)

    users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"online": True}},
    )

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(user_id)

        users_collection.update_one(
            {"user_id": user_id},
            {"$set": {"online": False, "last_seen": datetime.utcnow()}},
        )
