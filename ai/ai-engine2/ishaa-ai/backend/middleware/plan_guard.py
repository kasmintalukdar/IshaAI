# ==============================================================
# FILE: backend/middleware/plan_guard.py
# ==============================================================

import logging
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError

from config import settings
from database import get_redis
from services.plan_limits_service import (
    Plan, PlanConfig, PLAN_CONFIGS, UsageFeature,
    enforce_limit, get_ai_model_for_plan
)

logger = logging.getLogger(__name__)

# ── FIX #1: Keep _id: 1 so the returned doc is NEVER an empty dictionary `{}` ──
_PLAN_PROJECTION = {"subscription.plan": 1, "_id": 1}

@dataclass(frozen=True)
class PlanInfo:
    user_id:      str
    plan:         Plan
    config:       PlanConfig
    ai_model:     str
    uses_own_key: bool


async def get_current_user_id(
    authorization: Annotated[str | None, Header()] = None
) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header format: 'Bearer <token>'")

    token = authorization[7:]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing 'sub' claim")
        return user_id
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def get_plan_info(
    user_id: str = Depends(get_current_user_id),
) -> PlanInfo:
    from database import _get_db
    from bson import ObjectId
    from bson.errors import InvalidId

    users_col = _get_db()["User_Smart_Profile"]

    query_conditions = [{"_id": user_id}]
    try:
        if len(user_id) == 24:
            query_conditions.append({"_id": ObjectId(user_id)})
    except InvalidId:
        pass

    doc = await users_col.find_one({"$or": query_conditions}, _PLAN_PROJECTION)

    # ── FIX #2: Check explicitly for None, not just a falsy empty dictionary ──
    if doc is None:
        raise HTTPException(
            status_code=404, 
            detail="User not found in database. Try registering a new account."
        )

    plan_str = doc.get("subscription", {}).get("plan", "free")

    try:
        plan = Plan(plan_str)
    except ValueError:
        logger.warning("unknown_plan_in_db", user_id=user_id, plan_str=plan_str)
        plan = Plan.FREE

    config = PLAN_CONFIGS[plan]

    return PlanInfo(
        user_id      = user_id,
        plan         = plan,
        config       = config,
        ai_model     = get_ai_model_for_plan(plan),
        uses_own_key = config.uses_own_api_key,
    )


async def require_ai_chat_access(plan_info: PlanInfo = Depends(get_plan_info)) -> PlanInfo:
    redis = await get_redis()
    await enforce_limit(redis, plan_info.user_id, plan_info.plan, UsageFeature.AI_CHAT)
    return plan_info

async def require_vision_access(plan_info: PlanInfo = Depends(get_plan_info)) -> PlanInfo:
    redis = await get_redis()
    await enforce_limit(redis, plan_info.user_id, plan_info.plan, UsageFeature.VISION_AUDIT)
    return plan_info

async def require_hint_access(plan_info: PlanInfo = Depends(get_plan_info)) -> PlanInfo:
    redis = await get_redis()
    await enforce_limit(redis, plan_info.user_id, plan_info.plan, UsageFeature.HINT)
    return plan_info