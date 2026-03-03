import logging
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
# CHANGED: Removed UJSONResponse completely
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from jose import jwt
from passlib.context import CryptContext
from config import settings
from database import _get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])

# Password Hashing
_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str = Field(..., min_length=6)

class RegisterRequest(BaseModel):
    name:     str      = Field(..., min_length=2, max_length=100)
    email:    EmailStr
    password: str      = Field(..., min_length=6)
    stream:   str      = Field(..., description="Science | Commerce | Arts")

def _create_token(user_id: str) -> str:
    expire  = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

@router.post("/login", summary="Student login")
async def login(body: LoginRequest):
    users_col = _get_db()["User_Smart_Profile"]
    user = await users_col.find_one({"profile.email": body.email})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    hashed = user["profile"].get("password", "")
    if not _pwd_ctx.verify(body.password, hashed):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = _create_token(str(user["_id"]))
    return {"access_token": token, "token_type": "bearer"}

@router.post("/register", summary="Student registration")
async def register(body: RegisterRequest):
    users_col = _get_db()["User_Smart_Profile"]
    existing = await users_col.find_one({"profile.email": body.email}, {"_id": 1})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id     = str(uuid.uuid4())[:12]
    hashed_pass = _pwd_ctx.hash(body.password)

    new_user = {
        "_id": user_id,
        "profile": {
            "name":     body.name,
            "email":    body.email,
            "avatar":   "",
            "stream":   body.stream,
            "password": hashed_pass,
            "role":     "student",
        },
        "gamification":    {"total_xp": 0, "streak": 0, "current_league": 1},
        "dashboard_insight": {"status": {"recent_accuracy": 0.5}},
        "wallet":          {"gems": 10, "purchased_gems": 0},
        "created_at":      datetime.now(timezone.utc)
    }

    await users_col.insert_one(new_user)
    return {"status": "success", "user_id": user_id}