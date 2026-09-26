# File: backend/app/api/auth.py



import os

import secrets

import logging

import smtplib



from email.mime.text import MIMEText

from email.mime.multipart import MIMEMultipart

from typing import Optional

from datetime import datetime, timedelta, timezone



from fastapi import APIRouter, HTTPException, Depends, status

from pydantic import BaseModel, EmailStr

from sqlalchemy.orm import Session

from passlib.context import CryptContext

from jose import jwt





# ============================================================

# DATABASE DEPENDENCY

# ============================================================



from ..database import connection



try:

    from ..database import get_db, models

except ImportError:

    get_db = connection.get_db

    from ..database import models





logger = logging.getLogger("uvicorn.error")



router = APIRouter(tags=["Authentication Engine"])





# ============================================================

# PASSWORD HASHING

# ============================================================



pwd_context = CryptContext(

    schemes=["bcrypt"],

    deprecated="auto"

)





# ============================================================

# JWT CONFIGURATION

# ============================================================



JWT_SECRET_KEY = os.getenv(

    "JWT_SECRET_KEY",

    "super-secret-dev-key-change-in-prod"

)



ALGORITHM = "HS256"



ACCESS_TOKEN_EXPIRE_MINUTES = 60

OTP_EXPIRATION_MINUTES = 5





# ============================================================

# TEMPORARY OTP STORE

# ============================================================



otp_store: dict[str, dict] = {}





# ============================================================

# HELPER FUNCTIONS

# ============================================================



def verify_password(

    plain_password: str,

    hashed_password: str

) -> bool:



    if not hashed_password:

        return False



    # Legacy plain-text password support

    if not hashed_password.startswith("$2b$"):

        return plain_password == hashed_password



    try:

        return pwd_context.verify(

            plain_password,

            hashed_password

        )

    except Exception:

        return False





def get_password_hash(password: str) -> str:

    return pwd_context.hash(password)


def normalize_student_secret(value: str) -> str:
    """Normalize branch secret without changing the stored dataset."""
    return "".join(ch for ch in str(value or "").upper() if ch.isalnum())





def create_access_token(

    data: dict,

    expires_delta: Optional[timedelta] = None

) -> str:



    to_encode = data.copy()



    expire = datetime.now(timezone.utc) + (

        expires_delta

        or timedelta(

            minutes=ACCESS_TOKEN_EXPIRE_MINUTES

        )

    )



    to_encode.update({

        "exp": expire

    })



    return jwt.encode(

        to_encode,

        JWT_SECRET_KEY,

        algorithm=ALGORITHM

    )





def dispatch_smtp_email(

    target_email: str,

    otp_code: str

) -> bool:



    sender_email = (

        os.getenv("MAIL_USERNAME")

        or os.getenv("SMTP_USERNAME")

    )



    raw_password = (

        os.getenv("MAIL_PASSWORD")

        or os.getenv("SMTP_PASSWORD")

    )



    if not sender_email or not raw_password:

        return False



    app_password = raw_password.replace(" ", "")



    try:



        msg = MIMEMultipart("alternative")



        msg["From"] = (

            f"Eco-Seat AI Portal <{sender_email}>"

        )



        msg["To"] = target_email



        msg["Subject"] = (

            "Eco-Seat AI: Identity Verification OTP"

        )



        html_content = f"""

        <div style="

            font-family: Arial, sans-serif;

            padding: 24px;

            background-color: #050816;

            color: #ffffff;

            border-radius: 16px;

            max-width: 450px;

            margin: auto;

        ">



            <h2 style="color:#22d3ee;">

                Eco-Seat AI Portal

            </h2>



            <hr style="

                border-color:rgba(255,255,255,0.1);

                margin:16px 0;

            " />



            <p style="

                font-size:13px;

                color:#94a3b8;

            ">

                Your identity verification passcode is:

            </p>



            <div style="

                background-color:#03050c;

                border:1px solid rgba(34,211,238,0.3);

                padding:16px;

                border-radius:12px;

                text-align:center;

                margin:20px 0;

            ">



                <span style="

                    font-family:monospace;

                    font-size:32px;

                    font-weight:900;

                    letter-spacing:0.25em;

                    color:#38bdf8;

                ">

                    {otp_code}

                </span>



            </div>



            <p style="

                font-size:11px;

                color:#64748b;

            ">

                This OTP expires in

                {OTP_EXPIRATION_MINUTES} minutes.

                Do not share this code.

            </p>



        </div>

        """



        msg.attach(

            MIMEText(

                html_content,

                "html"

            )

        )



        with smtplib.SMTP_SSL(

            "smtp.gmail.com",

            465

        ) as server:



            server.login(

                sender_email,

                app_password

            )



            server.sendmail(

                sender_email,

                target_email,

                msg.as_string()

            )



        logger.info(

            "OTP email successfully sent to %s",

            target_email

        )



        return True



    except Exception as exc:



        logger.error(

            "SMTP Dispatch Error: %s",

            str(exc)

        )



        return False





# ============================================================

# REQUEST / RESPONSE SCHEMAS

# ============================================================



class OTPRequestSchema(BaseModel):

    username: str

    password: str

    email: EmailStr

    role: Optional[str] = "student"





class OTPVerifySchema(BaseModel):

    email: EmailStr

    otp: str





class SignupSchema(BaseModel):

    username: str

    password: str

    email: EmailStr

    role: Optional[str] = "student"





# ============================================================

# NODE 1

# REQUEST OTP / LOGIN

# ============================================================



@router.post("/request-otp")

async def request_otp(

    payload: OTPRequestSchema,

    db: Session = Depends(get_db)

):



    username = payload.username.strip().lower()

    password = payload.password.strip()



    raw_role = (

        payload.role.strip().lower()

        if payload.role

        else "student"

    )



    target_email = (

        payload.email

        .strip()

        .lower()

    )



    normalized_role = "student"

    user_assigned_room = None





    # --------------------------------------------------------

    # ADMIN LOGIN

    # --------------------------------------------------------



    if raw_role in [

        "admin",

        "administrator"

    ]:



        admin_user = (

            db.query(models.AdminUser)

            .filter(

                models.AdminUser.username.ilike(

                    username

                )

            )

            .first()

        )



        if (

            not admin_user

            or not verify_password(

                password,

                admin_user.password

            )

        ):

            raise HTTPException(

                status_code=status.HTTP_401_UNAUTHORIZED,

                detail=(

                    "Authentication Failed: "

                    "Invalid admin credentials."

                )

            )
        # Entered email is only the OTP delivery address.

        normalized_role = "admin"





    # --------------------------------------------------------

    # INVIGILATOR LOGIN

    # --------------------------------------------------------



    elif raw_role in [

        "invigilator",

        "invig"

    ]:



        invig_user = (

            db.query(models.InvigilatorUser)

            .filter(

                models.InvigilatorUser.username.ilike(

                    username

                )

            )

            .first()

        )



        if (

            not invig_user

            or not verify_password(

                password,

                invig_user.password

            )

        ):

            raise HTTPException(

                status_code=status.HTTP_401_UNAUTHORIZED,

                detail=(

                    "Authentication Failed: "

                    "Invalid invigilator credentials."

                )

            )
        # Entered email is only the OTP delivery address.

        normalized_role = "invigilator"

        # No permanent room binding.
        # Invigilator selects any configured room from the dashboard.
        user_assigned_room = None


    # --------------------------------------------------------

    # STUDENT LOGIN

    # --------------------------------------------------------



    else:



        student_identifier = username.strip()

        # Accept either exact roll number OR exact student name
        # from the uploaded StudentSeating database.
        student = (
            db.query(models.StudentSeating)
            .filter(models.StudentSeating.roll_no.ilike(student_identifier))
            .first()
        )

        if not student:
            name_matches = (
                db.query(models.StudentSeating)
                .filter(models.StudentSeating.name.ilike(student_identifier))
                .all()
            )

            if len(name_matches) == 1:
                student = name_matches[0]
            elif len(name_matches) > 1:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "More than one student has this name. "
                        "Please use your roll number to sign in."
                    )
                )

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "Authentication Failed: student not found. "
                    "Use the exact name or roll number from the uploaded seating data."
                )
            )

        # Student Secret Key remains the Branch in the uploaded record.
        if normalize_student_secret(password) != normalize_student_secret(student.branch):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Authentication Failed: Invalid Secret Key "
                    "(use the branch from the uploaded student record)."
                )
            )

        normalized_role = "student"
        user_assigned_room = student.room_no





    # ========================================================

    # CREATE OTP

    # ========================================================



    otp = "".join(

        secrets.choice("0123456789")

        for _ in range(6)

    )



    otp_store[target_email] = {



        "otp": otp,



        "role": normalized_role,



        "username": (
            str(student.roll_no)
            if normalized_role == "student"
            else username
        ),

        "assigned_room": user_assigned_room,



        "created_at": datetime.now(

            timezone.utc

        )

    }





    # ========================================================

    # SEND OTP

    # ========================================================



    sent = dispatch_smtp_email(

        target_email,

        otp

    )



    if not sent:



        logger.warning(

            "[DEV MODE] SMTP Bypass. "

            "Generated OTP for %s: %s",

            target_email,

            otp

        )



        return {



            "status": "success",



            "message": (

                "Dev Mode: Check backend "

                "console for OTP code."

            ),



            "dev_otp": otp,



            "role": normalized_role,



            "assigned_room":

                user_assigned_room

        }



    return {



        "status": "success",



        "message": (

            "Verification token generated "

            f"and sent to {target_email}."

        ),



        "role": normalized_role,



        "assigned_room":

            user_assigned_room

    }





# ============================================================

# NODE 2

# VERIFY OTP & ISSUE JWT

# ============================================================



@router.post("/verify-otp")

async def verify_otp(

    payload: OTPVerifySchema

):



    target_email = (

        payload.email

        .strip()

        .lower()

    )



    otp_attempt = (

        payload.otp

        .strip()

    )



    stored_data = otp_store.get(

        target_email

    )



    if (

        not stored_data

        or not isinstance(

            stored_data,

            dict

        )

    ):

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=(

                "Verification Failed: "

                "OTP is invalid or expired."

            )

        )



    expected_otp = stored_data.get(

        "otp"

    )



    created_at = stored_data.get(

        "created_at"

    )



    if (

        created_at

        and (

            datetime.now(timezone.utc)

            - created_at

        )

        > timedelta(

            minutes=OTP_EXPIRATION_MINUTES

        )

    ):



        otp_store.pop(

            target_email,

            None

        )



        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=(

                "Verification Failed: "

                "The OTP has expired. "

                "Please request a new one."

            )

        )



    if not secrets.compare_digest(

        str(expected_otp),

        otp_attempt

    ):

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=(

                "Verification Failed: "

                "The OTP entered is invalid."

            )

        )



    assigned_room = stored_data.get(

        "assigned_room"

    )



    username = stored_data.get(

        "username",

        target_email

    )



    role = stored_data.get(

        "role",

        "student"

    )



    # Consume OTP

    otp_store.pop(

        target_email,

        None

    )





    # ========================================================

    # JWT

    # ========================================================



    access_token = create_access_token(



        data={



            "sub": username,



            "email": target_email,



            "role": role,



            "room": assigned_room

        }

    )



    return {



        "status": "success",



        "message": (

            "Identity verification "

            "successful."

        ),



        "token": access_token,



        "token_type": "bearer",



        "username": username,



        "role": role,



        "assigned_room":

            assigned_room

    }





# ============================================================

# NODE 3

# SIGNUP ENGINE

# ============================================================



@router.post(

    "/signup",

    status_code=status.HTTP_201_CREATED

)

@router.post(

    "/register",

    status_code=status.HTTP_201_CREATED

)

async def signup(

    payload: SignupSchema,

    db: Session = Depends(get_db)

):



    username = (

        payload.username

        .strip()

        .lower()

    )



    password = (

        payload.password

        .strip()

    )



    email = (

        payload.email

        .strip()

        .lower()

    )



    raw_role = (

        payload.role

        .strip()

        .lower()

        if payload.role

        else "student"

    )



    if not username:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail="Username is required."

        )



    if not password:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail="Password is required."

        )





    # ========================================================

    # ADMIN SIGNUP

    # ========================================================



    if raw_role in [

        "admin",

        "administrator"

    ]:



        existing = (

            db.query(models.AdminUser)

            .filter(

                models.AdminUser.username.ilike(

                    username

                )

            )

            .first()

        )



        if existing:

            raise HTTPException(

                status_code=status.HTTP_400_BAD_REQUEST,

                detail=(

                    "Admin username already "

                    "registered."

                )

            )



        existing_email = (

            db.query(models.AdminUser)

            .filter(

                models.AdminUser.email.ilike(

                    email

                )

            )

            .first()

        )



        if existing_email:

            raise HTTPException(

                status_code=status.HTTP_400_BAD_REQUEST,

                detail=(

                    "Admin email already "

                    "registered."

                )

            )



        new_user = models.AdminUser(



            username=username,



            email=email,



            password=get_password_hash(

                password

            )

        )



        db.add(new_user)



        try:

            db.commit()



        except Exception:

            db.rollback()



            raise HTTPException(

                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

                detail=(

                    "Unable to create "

                    "admin account."

                )

            )



        return {



            "status": "success",



            "message": (

                f"Admin '{username}' "

                "registered successfully."

            )

        }





    # ========================================================

    # INVIGILATOR SIGNUP

    # ========================================================



    elif raw_role in [

        "invigilator",

        "invig"

    ]:



        existing = (

            db.query(models.InvigilatorUser)

            .filter(

                models.InvigilatorUser.username.ilike(

                    username

                )

            )

            .first()

        )



        if existing:

            raise HTTPException(

                status_code=status.HTTP_400_BAD_REQUEST,

                detail=(

                    "Invigilator username "

                    "already registered. "

                    "Please proceed to Login."

                )

            )



        existing_email = (

            db.query(models.InvigilatorUser)

            .filter(

                models.InvigilatorUser.email.ilike(

                    email

                )

            )

            .first()

        )



        if existing_email:

            raise HTTPException(

                status_code=status.HTTP_400_BAD_REQUEST,

                detail=(

                    "Invigilator email "

                    "already registered."

                )

            )





        # Create account first; Admin assigns a real room later.
        new_user = models.InvigilatorUser(
            username=username,
            email=email,
            password=get_password_hash(password),
            assigned_room=None,
        )

        db.add(new_user)



        try:



            db.commit()

            db.refresh(new_user)



        except Exception:



            db.rollback()



            raise HTTPException(

                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

                detail=(

                    "Unable to create "

                    "invigilator account."

                )

            )



        return {
            "status": "success",
            "message": (
                f"Invigilator '{username}' registered successfully. "
                "Admin can now assign an examination room."
            ),
            "assigned_room": None,
        }


    # ========================================================

    # STUDENT SIGNUP NOT ALLOWED

    # ========================================================



    else:



        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=(

                "Student accounts must be "

                "managed through the classroom "

                "allocation system."

            )

        )