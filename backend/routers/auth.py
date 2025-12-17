from fastapi import APIRouter, Depends, HTTPException, Body, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from typing import Union, Dict, Any
import jwt
from datetime import datetime, timedelta
import os

from models import User, PasswordResetRequest, PasswordReset
from database import db
from services.email_service import email_service

router = APIRouter()

# Secret key to sign the JWT token
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # default 7 days (10080 minutes)
BCRYPT_MAX_BYTES = 72

pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],
    default="bcrypt_sha256",
    deprecated="auto",
)


def _truncate_utf8(password: str, limit: int) -> str:
    """Trim a password to fit into ``limit`` bytes without breaking utf-8."""
    encoded = password.encode("utf-8")
    if len(encoded) <= limit:
        return password
    truncated = encoded[:limit]
    while True:
        try:
            return truncated.decode("utf-8")
        except UnicodeDecodeError:
            truncated = truncated[:-1]
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Token(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/api/v1/auth/signup", response_model=User)
async def create_user(user_data: User):
    if db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    try:
        hashed_password = pwd_context.hash(user_data.password)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="Unable to process password; please choose a shorter value.",
        ) from exc
    user_in_db = user_data.model_copy(update={"password": hashed_password})
    # Ensure tourCompleted is set to False for new users
    user_dict = user_in_db.model_dump()
    if 'tourCompleted' not in user_dict or user_dict['tourCompleted'] is None:
        user_dict['tourCompleted'] = False
    db.users.insert_one(user_dict)
    return user_in_db

@router.post("/api/v1/auth/forgot-password")
async def forgot_password(reset_request: PasswordResetRequest, request: Request):
    user = db.users.find_one({"email": reset_request.email})
    if not user:
        # Don't reveal if user exists
        return {"message": "If an account with that email exists, a password reset link has been sent."}
    
    # Generate reset token
    expires_delta = timedelta(hours=1)
    reset_token = create_access_token(
        data={"sub": user["email"], "type": "password_reset"},
        expires_delta=expires_delta
    )
    
    # Determine frontend URL
    # 1. Try env var first
    frontend_url = os.getenv("FRONTEND_URL")
    
    # 2. If not set, try Origin header (this works well for deployed apps calling from frontend)
    if not frontend_url:
        origin = request.headers.get("origin")
        if origin:
            frontend_url = origin
            
    # 3. Fallback to localhost
    if not frontend_url:
        frontend_url = "http://localhost:5137"
    
    # Ensure no trailing slash
    if frontend_url.endswith('/'):
        frontend_url = frontend_url[:-1]
        
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    # Send email
    await email_service.send_password_reset_email(user["email"], reset_link)
    
    return {"message": "If an account with that email exists, a password reset link has been sent."}

@router.post("/api/v1/auth/reset-password")
async def reset_password(reset_data: PasswordReset):
    try:
        payload = jwt.decode(reset_data.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid token")
            
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Update password
    hashed_password = pwd_context.hash(reset_data.new_password)
    db.users.update_one({"email": email}, {"$set": {"password": hashed_password}})
    
    return {"message": "Password has been reset successfully"}

@router.post("/api/v1/auth/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.users.find_one({"email": form_data.username})
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    original_password = form_data.password
    password_to_verify = original_password
    hash_scheme = pwd_context.identify(user["password"])
    if hash_scheme == "bcrypt":
        password_to_verify = _truncate_utf8(password_to_verify, BCRYPT_MAX_BYTES)

    try:
        verified = pwd_context.verify(password_to_verify, user["password"])
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="Unable to process password; please reset it and try again.",
        ) from exc

    if not verified:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if pwd_context.needs_update(user["password"]):
        updated_hash = pwd_context.hash(original_password)
        db.users.update_one({"_id": user["_id"]}, {"$set": {"password": updated_hash}})
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "role": user.get("role", "user")}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return User(**user)

@router.get("/api/v1/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/api/v1/auth/me", response_model=User)
async def update_user_profile(
    updates: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    # Remove password from updates if present (should be updated via separate endpoint)
    updates.pop('password', None)
    updates.pop('email', None)  # Email shouldn't be changed
    
    # Only allow specific fields to be updated
    allowed_fields = {'firstName', 'lastName', 'tourCompleted', 'phone', 'timezone'}
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if not filtered_updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    # Update user in database
    result = db.users.update_one(
        {"email": current_user.email},
        {"$set": filtered_updates}
    )
    
    # Fetch updated user
    updated_user = db.users.find_one({"email": current_user.email})
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**updated_user)