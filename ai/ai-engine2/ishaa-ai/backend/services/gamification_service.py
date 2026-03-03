# ==============================================================
# FILE: backend/services/gamification_service.py
#
# PURPOSE:
#   Handles all XP, gem, and streak updates for students.
#   Uses MongoDB atomic $inc operations to prevent race conditions
#   when multiple concurrent requests try to award XP simultaneously.
#
# ATOMIC OPERATIONS:
#   MongoDB's $inc is atomic at the document level — if two requests
#   try to award XP at the same time, both increments will be applied
#   correctly. No locks, no lost updates.
#
# STREAK LOGIC:
#   A streak increments if the student was last active YESTERDAY.
#   If last active was today (already counted), streak unchanged.
#   If last active was 2+ days ago, streak resets to 1.
# ==============================================================

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorCollection

logger = logging.getLogger(__name__)

# XP award values for different actions
XP_VALUES = {
    "chat_turn":           5,    # Each Socratic exchange
    "self_correction":    15,    # Student finds their own mistake
    "vision_attempt":      5,    # Submits handwriting for review
    "hint_avoided":       10,    # Solves without any hints
    "streak_day":         20,    # Maintaining daily streak
}

# Gem costs for hint layers (mirror plan_limits_service)
GEM_COSTS = {1: 0, 2: 5, 3: 15}


async def award_xp(
    users_col: AsyncIOMotorCollection,
    user_id:   str,
    xp:        int,
    reason:    str = "",
) -> dict:
    """
    Awards XP to a student using an atomic $inc.
    Also updates the streak if applicable.
    
    Args:
        users_col: Motor collection for User_Smart_Profile.
        user_id:   Student's _id.
        xp:        XP amount to award.
        reason:    Logging label (e.g. "self_correction").
    
    Returns:
        Dict with awarded_xp and reason.
    """
    now = datetime.now(timezone.utc)

    # Atomic: increment XP and update last_active_date in one operation
    await users_col.update_one(
        {"_id": user_id},
        {
            "$inc": {"gamification.total_xp": xp},
            "$set": {"gamification.last_active_date": now},
        }
    )

    logger.debug("xp_awarded", user_id=user_id, xp=xp, reason=reason)
    return {"awarded_xp": xp, "reason": reason}


async def deduct_gems(
    users_col: AsyncIOMotorCollection,
    user_id:   str,
    amount:    int,
) -> bool:
    """
    Atomically deducts gems from a student's wallet.
    Uses a conditional update to prevent overdraft — the update
    only applies if the student has enough gems.
    
    Args:
        users_col: Motor collection.
        user_id:   Student's _id.
        amount:    Gems to deduct.
    
    Returns:
        True if deducted successfully, False if insufficient gems.
    """
    # Conditional update: only deduct if wallet.gems >= amount
    result = await users_col.update_one(
        {"_id": user_id, "wallet.gems": {"$gte": amount}},
        {"$inc": {"wallet.gems": -amount, "wallet.purchased_gems": -amount}}
    )

    if result.modified_count == 0:
        logger.info("gem_deduction_failed_insufficient", user_id=user_id, amount=amount)
        return False

    logger.debug("gems_deducted", user_id=user_id, amount=amount)
    return True


async def update_streak(
    users_col: AsyncIOMotorCollection,
    user_id:   str,
) -> int:
    """
    Updates the student's daily streak.
    
    Rules:
      - Last active today → no change (already counted)
      - Last active yesterday → streak += 1, award streak XP
      - Last active 2+ days ago → streak resets to 1
    
    Args:
        users_col: Motor collection.
        user_id:   Student's _id.
    
    Returns:
        New streak value.
    """
    user = await users_col.find_one(
        {"_id": user_id},
        {"gamification.streak": 1, "gamification.last_active_date": 1}
    )
    if not user:
        return 0

    gamification     = user.get("gamification", {})
    current_streak   = gamification.get("streak", 0)
    last_active      = gamification.get("last_active_date")
    now              = datetime.now(timezone.utc)
    today            = now.date()

    if last_active:
        last_date = last_active.date() if hasattr(last_active, "date") else today

        if last_date == today:
            return current_streak   # Already active today

        elif last_date == today - timedelta(days=1):
            new_streak = current_streak + 1
            await users_col.update_one(
                {"_id": user_id},
                {
                    "$set": {
                        "gamification.streak":          new_streak,
                        "gamification.last_active_date": now,
                    }
                }
            )
            # Award streak XP
            await award_xp(users_col, user_id, XP_VALUES["streak_day"], reason="streak_day")
            return new_streak

        else:
            # Streak broken — reset to 1
            await users_col.update_one(
                {"_id": user_id},
                {"$set": {"gamification.streak": 1, "gamification.last_active_date": now}}
            )
            return 1

    # First activity ever
    await users_col.update_one(
        {"_id": user_id},
        {"$set": {"gamification.streak": 1, "gamification.last_active_date": now}}
    )
    return 1
