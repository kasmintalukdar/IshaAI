# ==============================================================
# FILE: ishaa_v2/routers/admin.py
#
# PURPOSE:
#   Protected admin endpoints for managing user subscriptions.
#   Auth: X-Admin-Secret header checked against settings.ADMIN_SECRET.
# ==============================================================

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from config import settings
from database import get_db # Changed from _get_db to standard get_db based on usual motor setups
from models.schemas import (
    AdminSubscriptionUpdate,
    AdminSubscriptionResponse,
    SubscriptionDetailResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Admin Auth Dependency ─────────────────────────────────────

async def _verify_admin_secret(
    x_admin_secret: str = Header(..., alias="X-Admin-Secret"),
) -> None:
    if not hasattr(settings, 'ADMIN_SECRET') or not settings.ADMIN_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Admin endpoints are not configured. Set ADMIN_SECRET in environment.",
        )
    if x_admin_secret != settings.ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Invalid admin secret")


# ── Helper: Build MongoDB user filter ─────────────────────────

def _user_filter(user_id: str) -> dict:
    query_conditions = [{"_id": user_id}]
    try:
        if len(user_id) == 24:
            query_conditions.append({"_id": ObjectId(user_id)})
    except InvalidId:
        pass
    return {"$or": query_conditions} if len(query_conditions) > 1 else {"_id": user_id}


async def _find_user(user_email: Optional[str], user_id: Optional[str]) -> dict:
    # Use get_db() to fetch the Motor database instance
    db = await get_db() if __import__('inspect').iscoroutinefunction(get_db) else get_db()
    users_col = db["User_Smart_Profile"]

    if user_email:
        doc = await users_col.find_one(
            {"profile.email": user_email},
            {"subscription": 1, "profile.email": 1, "free_tier": 1, "_id": 1},
        )
    elif user_id:
        doc = await users_col.find_one(
            _user_filter(user_id),
            {"subscription": 1, "profile.email": 1, "free_tier": 1, "_id": 1},
        )
    else:
        raise HTTPException(status_code=400, detail="Provide user_email or user_id")

    if doc is None:
        identifier = user_email or user_id
        raise HTTPException(status_code=404, detail=f"User not found: {identifier}")

    return doc


# ── PATCH /admin/subscription ────────────────────────────────

@router.patch(
    "/subscription",
    response_model=AdminSubscriptionResponse,
    summary="Upgrade or downgrade a user's subscription plan",
    dependencies=[Depends(_verify_admin_secret)],
)
async def update_subscription(body: AdminSubscriptionUpdate):
    db = await get_db() if __import__('inspect').iscoroutinefunction(get_db) else get_db()
    users_col = db["User_Smart_Profile"]

    # 1. Find the user
    doc = await _find_user(body.user_email, body.user_id)
    user_id = str(doc["_id"])
    email = doc.get("profile", {}).get("email", "")

    # 2. Read current plan
    old_plan = doc.get("subscription", {}).get("plan", "free")

    # 3. Build update
    now = datetime.now(timezone.utc)
    update_fields = {
        "subscription.plan":          body.plan,
        "subscription.started_at":    now,
        "subscription.expires_at":    body.expires_at,
        "subscription.previous_plan": old_plan,
        "subscription.updated_at":    now,
        "subscription.updated_by":    "admin",
        "subscription.reason":        body.reason or "admin_update",
    }

    # Initialize payment subdocument if missing
    if not doc.get("subscription", {}).get("payment"):
        update_fields["subscription.payment"] = {
            "gateway": None,
            "customer_id": None,
            "subscription_id": None,
            "last_payment_at": None,
        }

    # 4. Apply update
    result = await users_col.update_one(
        _user_filter(user_id),
        {"$set": update_fields},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=500, detail="Update failed: user document not matched")

    logger.info(
        f"subscription_updated user_id={user_id} email={email} "
        f"old_plan={old_plan} new_plan={body.plan} "
        f"expires_at={body.expires_at} by=admin reason={body.reason}"
    )

    return AdminSubscriptionResponse(
        status="success",
        user_id=user_id,
        email=email,
        old_plan=old_plan,
        new_plan=body.plan,
        started_at=now,
        expires_at=body.expires_at,
        updated_by="admin",
    )


# ── GET /admin/subscription/{user_id} ────────────────────────

@router.get(
    "/subscription/{user_id}",
    response_model=SubscriptionDetailResponse,
    summary="Get detailed subscription info for a user",
    dependencies=[Depends(_verify_admin_secret)],
)
async def get_subscription_detail(user_id: str):
    doc = await _find_user(user_email=None, user_id=user_id)

    subscription = doc.get("subscription", {"plan": "free"})
    stored_plan = subscription.get("plan", "free")
    expires_at = subscription.get("expires_at")

    # Compute effective plan
    effective_plan = stored_plan
    is_expired = False
    if stored_plan != "free" and expires_at is not None:
        # Support both datetime objects and string parsing if necessary
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            except ValueError:
                pass
        
        if isinstance(expires_at, datetime) and expires_at < datetime.now(timezone.utc):
            effective_plan = "free"
            is_expired = True

    # Check if user has an API key stored
    free_tier = doc.get("free_tier", {})
    has_api_key = bool(free_tier.get("encrypted_api_key"))

    return SubscriptionDetailResponse(
        user_id=str(doc["_id"]),
        email=doc.get("profile", {}).get("email", ""),
        subscription=subscription,
        effective_plan=effective_plan,
        is_expired=is_expired,
        has_api_key=has_api_key,
    )