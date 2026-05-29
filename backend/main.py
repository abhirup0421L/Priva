from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone, timedelta
from database import users_collection, friends_collection, messages_collection
from auth import send_otp, hash_password, verify_password, create_token
from websocket_manager import manager
from bson import ObjectId

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

class DeleteMessageRequest(BaseModel):
    message_id: str
    user_id: str

class ProfilePicRequest(BaseModel):
    user_id: str
    profile_pic: int

class ThemeRequest(BaseModel):
    user_id: str
    theme: int




IST = timezone(timedelta(hours=5, minutes=30))

def now_ist():
    return datetime.now(IST)

def now_ist_text():
    return datetime.now(IST).strftime("%I:%M %p")

def format_last_seen(value):
    if not value:
        return "recently"

    if hasattr(value, "strftime"):
        return value.strftime("%I:%M %p")

    return str(value)


@app.post("/send-otp")
def send_signup_otp(data: EmailRequest):
    existing_user = users_collection.find_one({"email": data.email})

    if existing_user and existing_user.get("verified") == True:
        return {"error": "This email is already registered."}

    sent = send_otp(data.email)

    if not sent:
        return {"error": "OTP failed"}

    return {"message": "OTP sent successfully"}


@app.post("/signup")
def signup(data: SignupRequest):
    if users_collection.find_one({"email": data.email}):
        return {"error": "Email already registered"}

    if users_collection.find_one({"user_id": data.user_id}):
        return {"error": "User ID already exists"}

    users_collection.insert_one({
        "email": data.email,
        "user_id": data.user_id,
        "password": hash_password(data.password),
        "verified": True,
        "online": False,
        "last_seen": now_ist_text(),
        "profile_pic": 1,
        "theme": 1,
    })

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
        {"$set": {"online": True}},
    )

    token = create_token(data.user_id)

    return {
        "message": "Login successful",
        "token": token,
        "user_id": data.user_id,
        "profile_pic": user.get("profile_pic", 1),
        "theme": user.get("theme", 1),
    }

@app.post("/activate/{user_id}")
def activate_user(user_id: str):
    users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"online": True}},
    )
    return {"message": "User active"}

@app.post("/logout/{user_id}")
def logout(user_id: str):
    users_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "online": False,
                "last_seen": now_ist_text(),
            }
        },
    )

    messages_collection.delete_many({
        "$or": [
            {"sender_id": user_id, "read": True},
            {"receiver_id": user_id, "read": True},
        ]
    })

    return {"message": "Logged out"}


@app.get("/search-users/{query}/{current_user}")
def search_users(query: str, current_user: str):
    query = query.strip()
    current_user = current_user.strip()

    if not query:
        return []

    users = users_collection.find(
        {
            "$and": [
                {"user_id": {"$regex": f"^{query}", "$options": "i"}},
                {"user_id": {"$ne": current_user}},
            ]
        },
        {"_id": 0, "user_id": 1, "online": 1},
    ).limit(8)

    return list(users)


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
        "created_at": now_ist(),
    })

    return {"message": "Friend added"}


@app.delete("/remove-friend")
def remove_friend(data: FriendRequest):
    user_id = data.user_id.strip()
    friend_id = data.friend_id.strip()

    result = friends_collection.delete_one({
        "$or": [
            {"user1": user_id, "user2": friend_id},
            {"user1": friend_id, "user2": user_id},
        ]
    })

    messages_collection.delete_many({
        "$or": [
            {"sender_id": user_id, "receiver_id": friend_id},
            {"sender_id": friend_id, "receiver_id": user_id},
        ]
    })

    if result.deleted_count == 0:
        return {"error": "Friend not found"}

    return {"message": "Friend removed"}


@app.post("/update-profile-pic")
def update_profile_pic(data: ProfilePicRequest):
    if data.profile_pic < 1 or data.profile_pic > 5:
        return {"error": "Invalid profile picture"}

    users_collection.update_one(
        {"user_id": data.user_id},
        {"$set": {"profile_pic": data.profile_pic}}
    )

    return {"message": "Profile picture updated"}

@app.post("/update-theme")
def update_theme(data: ThemeRequest):
    if data.theme < 1 or data.theme > 9:
        return {"error": "Invalid theme"}

    users_collection.update_one(
        {"user_id": data.user_id},
        {"$set": {"theme": data.theme}}
    )

    return {"message": "Theme updated"}

@app.get("/user-settings/{user_id}")
def get_user_settings(user_id: str):
    user = users_collection.find_one(
        {"user_id": user_id},
        {"_id": 0, "profile_pic": 1, "theme": 1}
    )

    if not user:
        return {"error": "User not found"}

    return {
        "profile_pic": user.get("profile_pic", 1),
        "theme": user.get("theme", 1),
    }



@app.get("/friends/{user_id}")
def get_friends(user_id: str):
    user_id = user_id.strip()

    friends = friends_collection.find({
        "$or": [
            {"user1": user_id},
            {"user2": user_id},
        ]
    })

    result = []
    added = set()

    for f in friends:
        friend_id = f["user2"] if f["user1"] == user_id else f["user1"]

        if friend_id == user_id:
            continue

        if friend_id in added:
            continue

        friend_user = users_collection.find_one({"user_id": friend_id})

        if friend_user:
            unread_count = messages_collection.count_documents({
                "sender_id": friend_id,
                "receiver_id": user_id,
                "read": False,
            })

            last_message = messages_collection.find_one(
                {
                    "$or": [
                        {"sender_id": user_id, "receiver_id": friend_id},
                        {"sender_id": friend_id, "receiver_id": user_id},
                    ]
                },
                sort=[("created_at", -1)]
            )

            result.append({
                "user_id": friend_id,
                "online": friend_user.get("online", False),
                "last_seen": format_last_seen(friend_user.get("last_seen")),
                "profile_pic": friend_user.get("profile_pic", 1),
                "unread_count": unread_count,
                "last_message_time": (
                    last_message.get("created_at")
                    if last_message
                    else f.get("created_at")
                ),
            })

    result.sort(
        key=lambda x: x.get("last_message_time") or datetime.min.replace(tzinfo=IST),
        reverse=True
    )

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
            "message_id": str(m["_id"]),
            "sender_id": m["sender_id"],
            "receiver_id": m["receiver_id"],
            "text": m["text"],
            "read": m["read"],
            "created_at": str(m["created_at"]),
        })

    return result

@app.delete("/delete-message")
def delete_message(data: DeleteMessageRequest):
    msg = messages_collection.find_one({"_id": ObjectId(data.message_id)})

    if not msg:
        return {"error": "Message not found"}

    if msg["sender_id"] != data.user_id:
        return {"error": "You can only delete your own message"}

    messages_collection.delete_one({"_id": ObjectId(data.message_id)})

    return {"message": "Message deleted"}

@app.post("/send-message")
async def send_message(data: MessageRequest):
    message = {
        "sender_id": data.sender_id,
        "receiver_id": data.receiver_id,
        "text": data.text,
        "read": False,
        "created_at": now_ist(),
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
    await websocket.accept()

    manager.active_connections[user_id] = websocket

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        print(f"{user_id} disconnected")

    except Exception as e:
        print("WebSocket error:", e)

    finally:
        if user_id in manager.active_connections:
            del manager.active_connections[user_id]
