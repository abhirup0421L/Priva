import bcrypt
import random
import smtplib
import os
from datetime import datetime, timedelta
from email.message import EmailMessage
from jose import jwt
from dotenv import load_dotenv
from database import users_collection

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(user_id):
    return jwt.encode({"user_id": user_id}, SECRET_KEY, algorithm="HS256")


def send_otp(email):
    otp = str(random.randint(100000, 999999))

    users_collection.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "otp": otp,
                "otp_expiry": datetime.utcnow() + timedelta(minutes=5),
                "verified": False,
            }
        },
        upsert=True,
    )

    try:
        msg = EmailMessage()
        msg["Subject"] = "Your Priva OTP Verification"
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = email
        msg.set_content(f"Your Priva OTP is: {otp}")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)

    except Exception as e:
        print("EMAIL SEND ERROR:", e)

    return True
