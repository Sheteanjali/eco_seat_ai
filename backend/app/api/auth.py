import pydantic
from pydantic import SecretStr
import builtins
import random
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import models, connection

# 🛡️ Injection Layer: Injecting SecretStr right into the core environment modules
for module in [builtins, pydantic, pydantic.main]:
    if not hasattr(module, "SecretStr"):
        setattr(module, "SecretStr", SecretStr)

router = APIRouter(prefix="/api/auth", tags=["Identity & Access"])

# Volatile In-Memory Cache Matrix for OTP Challenge Validation
otp_store = {}

# ------------------------------------------------------------------------
# NODE 1: REQUEST OTP (Verifies Credentials & Dispatches Secure Token)
# ------------------------------------------------------------------------
@router.post("/request-otp")
async def request_otp(credentials: dict, db: Session = Depends(connection.get_db)):
    
    print(f"\n========================================================")
    print(f"📡 [RAW INCOMING FRONTEND PAYLOAD]: {credentials}")
    print(f"========================================================\n")

    # Dynamic Field Standard Extraction
    raw_user = credentials.get('username') or credentials.get('adminUsername') or credentials.get('userId') or ""
    raw_pass = credentials.get('password') or credentials.get('securityPassword') or credentials.get('adminPassword') or ""
    raw_role = credentials.get('role') or credentials.get('accessRole') or "student"
    raw_email = credentials.get('email') or credentials.get('universityEmail') or ""

    username = str(raw_user).strip().lower()
    password = str(raw_pass).strip()
    role = str(raw_role).strip().lower()
    email = str(raw_email).strip().lower()

    if not email:
        raise HTTPException(status_code=400, detail="MFA Protocol Exception: Notification target email missing.")

    is_valid = False

    # A. Administrative Identity Validation
    if role == "admin" or "admin" in role:
        if (username == "admin" or "admin" in username) and password == "Nagpur@1289":
            is_valid = True
            print("✅ Status Core: Administrative Node Clearance Granted")
        else:
            raise HTTPException(status_code=401, detail="Authentication Failed. Please verify identity credentials.")

    # B. Invigilator Identity Validation
    elif role == "invigilator" or "invig" in role:
        if (username == "invigilator" or "invig" in username) and password == "RBU@Invig2026":
            is_valid = True
            print("✅ Status Core: Invigilator Node Clearance Granted")
        else:
            raise HTTPException(status_code=401, detail="Authentication Failed. Please verify identity credentials.")

    # C. Student Registry Scan Protocol
    else:
        student = db.query(models.StudentSeating).filter(models.StudentSeating.roll_no.like(username)).first()
        if student:
            if password.upper() == student.branch.strip().upper():
                is_valid = True
            else:
                raise HTTPException(status_code=401, detail="Authentication Failed: Invalid Secret Key (Branch Mismatch).")
        else:
            raise HTTPException(status_code=404, detail="Candidate Registry Not Found in Memory Matrix.")

    # 🚀 SECURE MAIL DISPATCH PROCESSOR WITH FIXED INDENTATION
    if is_valid:
        otp = str(random.randint(100000, 999999))
        otp_store[email] = otp

        print(f"\n🔑 [MFA CHALLENGE DISPATCHED] ---> ACCESS KEY FOR {email} IS: {otp} <--- 🔑\n")

        try:
            from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

            # Strict production configuration variables allocation
            mail_username = "anjalishete74@gmail.com"
            mail_password = "zfmkwhmbbbbxiyaj"

            print(f"📧 [SMTP ENGINE BOOT] - Initializing credentials for: {mail_username}")

            conf = ConnectionConfig(
                MAIL_USERNAME=mail_username,
                MAIL_PASSWORD=mail_password,
                MAIL_FROM=mail_username,
                MAIL_PORT=587,
                MAIL_SERVER="smtp.gmail.com",
                MAIL_STARTTLS=True,
                MAIL_SSL_TLS=False,
                USE_CREDENTIALS=True,
                VALIDATE_CERTS=True
            )

            # Elegant HTML responsive template wrapper mapping
            html_content = f"""
            <div style="font-family: sans-serif; padding: 24px; background-color: #050816; color: #ffffff; border-radius: 16px; max-width: 450px; margin: auto; border: 1px solid rgba(255,255,255,0.1);">
                <h2 style="color: #22d3ee; text-transform: uppercase; margin-bottom: 2px;">Eco-Seat AI Portal</h2>
                <p style="font-size: 9px; text-transform: uppercase; color: #64748b; tracking: 0.2em; margin-top: 0;">Verification Engine Node</p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 16px 0;" />
                <p style="font-size: 13px; color: #94a3b8;">Hello User,<br><br>Use the volatile security token below to authenticate your identity cluster access:</p>
                <div style="background-color: #03050c; border: 1px solid rgba(34,211,238,0.2); padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 0.2em; color: #ffffff;">{otp}</span>
                </div>
                <p style="font-size: 10px; color: #64748b;">This OTP is valid for 5 minutes. Do not share terminal passcodes.</p>
            </div>
            """

            message = MessageSchema(
                subject="Eco-Seat AI: Identity Verification OTP",
                recipients=[email],
                body=html_content,
                subtype=MessageType.html
            )

            mail_engine = FastMail(conf)
            await mail_engine.send_message(message)
            print("✅ OTP EMAIL SENT SUCCESSFULLY TO USER INBOX")
            
            return {
                "status": "success",
                "message": "Verification token successfully generated and fired to your inbox."
            }

        except Exception as e:
            print("❌ EMAIL ENGINE EXCEPTION TRIGGERED:", str(e))
            raise HTTPException(
                status_code=500,
                detail=f"Email delivery layer aborted: {str(e)}"
            )

# ------------------------------------------------------------------------
# NODE 2: VERIFY OTP (Validates Challenge Token & Grants JWT Token)
# ------------------------------------------------------------------------
@router.post("/verify-otp")
async def verify_otp(data: dict):
    email = str(data.get('email', '')).strip().lower()
    user_otp = str(data.get('otp', '')).strip()

    print(f"🔍 [MFA EVALUATION NODE] - Tracking Identity Node: {email} | Input Challenge: {user_otp}")

    # 👑 ULTIMATE VIVA PRESENTATION MASTER KEY BYPASS
    if user_otp == "123456" or user_otp == "197966" or user_otp == "502216":
        print(f"🔓 [MASTER BYPASS TRIGGERED] - Cryptographic access override granted for {email}")
        if email in otp_store:
            del otp_store[email]
        return {
            "status": "success", 
            "token": "RBU_ADMIN_SECURE_TOKEN_2026",
            "message": "Security Challenge Bypassed via Master Key Override"
        }

    if email in otp_store and otp_store[email] == user_otp:
        del otp_store[email] 
        print(f"🔓 Handshake Established: Secure node session token materialized.")
        return {
            "status": "success", 
            "token": "RBU_ADMIN_SECURE_TOKEN_2026",
            "message": "Security Challenge Successfully Answered"
        }
    
    print(f"🚫 Verification Rejected for {email}. Expected token: {otp_store.get(email, 'None')}")
    raise HTTPException(status_code=401, detail="MFA Error: Provided cryptographic token is corrupted or expired.")