# ==============================================================
# FILE: backend/services/plan_limits_service.py
#
# PURPOSE:
#   The gatekeeper for all AI features. Defines what each plan
#   (FREE / PRO / PREMIUM) can do, and enforces daily usage limits
#   using Redis atomic counters.
#
# WHY REDIS (not MongoDB) FOR RATE LIMITING:
#   ┌─────────────────────────────────────────────────────────┐
#   │  MongoDB:  ~5ms per read/write, document-level locking  │
#   │  Redis:    ~0.1ms per operation, atomic INCR            │
#   └─────────────────────────────────────────────────────────┘
#   Under heavy load (e.g. 1000 students submitting chat requests
#   per minute), MongoDB-based counters would create lock contention.
#   Redis INCR is atomic by design — no race conditions, no locking.
#
# DAILY RESET MECHANISM:
#   Each counter key in Redis includes today's date:
#     Key pattern: "usage:{user_id}:{feature}:{YYYY-MM-DD}"
#     e.g.        "usage:u123:ai_chats:2026-02-19"
#   
#   We set a TTL of 48 hours on each key — slightly more than 24h
#   to handle timezone edge cases. Old keys expire automatically.
#   No cron jobs, no scheduled tasks, no cleanup needed.
#
# ATOMIC OPERATIONS:
#   Redis INCR is atomic — safe for concurrent requests.
#   If a student opens ishaa in 3 browser tabs and submits chat
#   simultaneously, each INCR is atomic and the final count is correct.
#
# PLAN DEFINITIONS:
#   All plan limits are defined in PLAN_CONFIGS — single source of truth.
#   Change a limit here and it takes effect immediately (no deploy needed).
# ==============================================================

import logging
from datetime import date
from typing import Optional
from dataclasses import dataclass
from enum import Enum

from fastapi import HTTPException
from redis.asyncio import Redis

logger = logging.getLogger(__name__)

# TTL for daily usage keys — 48h ensures keys survive across midnight
_USAGE_KEY_TTL_SECONDS = 48 * 3600


# ─────────────────────────────────────────────────────────────
# SECTION 1: PLAN DEFINITIONS
#
# PLAN_CONFIGS is the single source of truth for what each plan
# allows. Change values here — they take effect app-wide.
# ─────────────────────────────────────────────────────────────

class Plan(str, Enum):
    FREE    = "free"
    PRO     = "pro"
    PREMIUM = "premium"


class UsageFeature(str, Enum):
    """Named features that consume a daily usage quota."""
    AI_CHAT      = "ai_chats"
    VISION_AUDIT = "vision_audits"
    HINT         = "hints"


@dataclass(frozen=True)
class PlanConfig:
    """
    Immutable configuration object for a single subscription plan.
    `frozen=True` prevents accidental mutation and enables hashing.
    None values mean unlimited (no cap enforced).
    """
    # ── Daily limits ──────────────────────────────────────────
    ai_chats_per_day:      Optional[int]   # Socratic chat turns/day
    vision_audits_per_day: Optional[int]   # Handwriting uploads/day
    hints_per_day:         Optional[int]   # Total hint unlocks/day

    # ── Feature flags ─────────────────────────────────────────
    max_hint_layer:   int            # 1=Gist only, 2=+Blueprint, 3=all
    max_subjects:     Optional[int]  # Subjects the student can unlock
    streak_rewards:   bool           # Whether XP streaks are active
    can_earn_gems:    bool           # Whether gem wallet earns gems

    # ── AI routing ────────────────────────────────────────────
    uses_own_api_key: bool   # True = student provides their Gemini key
    ai_model_tier:    str    # "flash-lite" | "flash" | "pro"


# ── Plan catalogue ────────────────────────────────────────────
PLAN_CONFIGS: dict[Plan, PlanConfig] = {

    Plan.FREE: PlanConfig(
        # Comfortable for a student doing ~20–30 questions/day
        ai_chats_per_day      = 10,
        vision_audits_per_day = 2,
        hints_per_day         = 5,
        max_hint_layer        = 2,          # Gist + Blueprint only
        max_subjects          = 1,          # One subject at a time
        streak_rewards        = False,
        can_earn_gems         = False,
        uses_own_api_key      = True,       # Must bring their own Gemini key
        ai_model_tier         = "flash-lite",
    ),

    Plan.PRO: PlanConfig(
        ai_chats_per_day      = 100,
        vision_audits_per_day = 20,
        hints_per_day         = 30,
        max_hint_layer        = 3,          # All layers including Logic Trace
        max_subjects          = None,       # All subjects
        streak_rewards        = True,
        can_earn_gems         = True,
        uses_own_api_key      = False,      # Uses ishaa's backend keys
        ai_model_tier         = "flash",
    ),

    Plan.PREMIUM: PlanConfig(
        ai_chats_per_day      = None,       # Unlimited
        vision_audits_per_day = None,
        hints_per_day         = None,
        max_hint_layer        = 3,
        max_subjects          = None,
        streak_rewards        = True,
        can_earn_gems         = True,
        uses_own_api_key      = False,
        ai_model_tier         = "pro",
    ),
}

# ── AI model name map ─────────────────────────────────────────
_MODEL_NAME_MAP: dict[str, str] = {
    "flash-lite": "gemini-2.5-flash-lite",
    "flash":      "gemini-2.5-flash",
    "pro":        "gemini-2.5-pro",
}


def get_ai_model_for_plan(plan: Plan) -> str:
    """Returns the Gemini model name string for a given plan."""
    tier = PLAN_CONFIGS[plan].ai_model_tier
    return _MODEL_NAME_MAP.get(tier, "gemini-2.5-flash-lite")


# ─────────────────────────────────────────────────────────────
# SECTION 2: REDIS KEY HELPERS
#
# Key naming convention includes the date so old keys expire
# naturally via Redis TTL — no cron cleanup needed.
# ─────────────────────────────────────────────────────────────

def _usage_key(user_id: str, feature: UsageFeature) -> str:
    """
    Builds the Redis key for a user's daily feature usage counter.
    
    Pattern: "usage:{user_id}:{feature}:{YYYY-MM-DD}"
    Example: "usage:u123:ai_chats:2026-02-19"
    
    Including the date means yesterday's key is a different key —
    today's counter starts fresh at 0 automatically.
    """
    today = date.today().isoformat()
    return f"usage:{user_id}:{feature.value}:{today}"


# ─────────────────────────────────────────────────────────────
# SECTION 3: CORE LIMIT ENFORCEMENT
#
# enforce_limit()  — call BEFORE the AI call
# record_usage()   — call AFTER a successful AI call
#
# If the AI call fails, DON'T call record_usage() — students
# should not be penalized for provider outages.
# ─────────────────────────────────────────────────────────────

async def enforce_limit(
    redis:   Redis,
    user_id: str,
    plan:    Plan,
    feature: UsageFeature,
) -> int:
    """
    Checks if the student is within their daily quota for a feature.
    Raises HTTP 429 if they've hit their limit.
    
    Uses Redis GET (read-only) — does NOT increment the counter.
    Call record_usage() after a successful operation to increment.
    
    Args:
        redis:   Redis client from connection pool.
        user_id: Student's _id.
        plan:    Their current subscription plan.
        feature: Which feature to check.
    
    Returns:
        Current usage count (int). Used by UI to show "7/10 used".
    
    Raises:
        HTTPException 429: Daily limit reached.
        HTTPException 403: Feature not available on this plan.
    """
    config = PLAN_CONFIGS[plan]

    # Map feature to its configured daily limit
    limit_map: dict[UsageFeature, Optional[int]] = {
        UsageFeature.AI_CHAT:      config.ai_chats_per_day,
        UsageFeature.VISION_AUDIT: config.vision_audits_per_day,
        UsageFeature.HINT:         config.hints_per_day,
    }

    daily_limit = limit_map.get(feature)

    # None = unlimited — skip all checks immediately
    if daily_limit is None:
        return 0

    key = _usage_key(user_id, feature)
    raw = await redis.get(key)
    current_count = int(raw) if raw else 0

    if current_count >= daily_limit:
        logger.info(
            "rate_limit_hit",
            user_id=user_id,
            feature=feature.value,
            used=current_count,
            limit=daily_limit,
            plan=plan.value,
        )
        raise HTTPException(
            status_code=429,
            detail={
                "error":       "daily_limit_reached",
                "feature":     feature.value,
                "used":        current_count,
                "limit":       daily_limit,
                "remaining":   0,
                "plan":        plan.value,
                "upgrade_msg": _upgrade_message(plan, feature, daily_limit),
                "resets_at":   "midnight UTC",
            }
        )

    return current_count


async def record_usage(
    redis:   Redis,
    user_id: str,
    feature: UsageFeature,
) -> int:
    """
    Atomically increments the usage counter for a feature.
    Sets a 48-hour TTL on new keys so they expire automatically.
    
    MUST be called only after a SUCCESSFUL AI API call.
    Do NOT call if the AI call failed — student isn't penalized
    for provider downtime.
    
    Args:
        redis:   Redis client.
        user_id: Student's _id.
        feature: Which feature was used.
    
    Returns:
        New count after increment.
    """
    key = _usage_key(user_id, feature)

    # Pipeline: INCR + EXPIRE in a single roundtrip to Redis
    # This is atomic — no race condition between INCR and EXPIRE
    async with redis.pipeline(transaction=True) as pipe:
        pipe.incr(key)
        pipe.expire(key, _USAGE_KEY_TTL_SECONDS)
        results = await pipe.execute()

    new_count = results[0]  # INCR result
    logger.debug("usage_recorded", user_id=user_id, feature=feature.value, count=new_count)
    return new_count


# ─────────────────────────────────────────────────────────────
# SECTION 4: FEATURE GATING (non-daily checks)
#
# Some restrictions are permanent flags, not daily counters.
# e.g., "free users can't use hint layer 3" regardless of count.
# ─────────────────────────────────────────────────────────────

def check_hint_layer_access(plan: Plan, requested_layer: int) -> None:
    """
    Enforces hint layer access based on plan.
    Layer 3 (Logic Trace) is Pro/Premium only.
    
    Raises:
        HTTPException 403: If plan doesn't allow this layer.
    """
    max_layer = PLAN_CONFIGS[plan].max_hint_layer
    if requested_layer > max_layer:
        raise HTTPException(
            status_code=403,
            detail={
                "error":       "hint_layer_locked",
                "requested":   requested_layer,
                "max_allowed": max_layer,
                "plan":        plan.value,
                "upgrade_msg": (
                    f"Layer {requested_layer} (Logic Trace) requires Pro plan. "
                    "Upgrade for ₹99/month to unlock full step-by-step breakdowns."
                ),
            }
        )


def check_subject_access(plan: Plan, enrolled_subject_count: int) -> None:
    """
    Checks if the student can unlock an additional subject.
    Free plan: 1 subject only. Pro/Premium: unlimited.
    
    Raises:
        HTTPException 403: If subject limit reached.
    """
    max_subjects = PLAN_CONFIGS[plan].max_subjects
    if max_subjects is not None and enrolled_subject_count >= max_subjects:
        raise HTTPException(
            status_code=403,
            detail={
                "error":       "subject_limit_reached",
                "current":     enrolled_subject_count,
                "max_allowed": max_subjects,
                "plan":        plan.value,
                "upgrade_msg": "Free plan allows 1 subject. Upgrade to Pro to unlock all.",
            }
        )


# ─────────────────────────────────────────────────────────────
# SECTION 5: USAGE SUMMARY (for dashboard display)
# ─────────────────────────────────────────────────────────────

async def get_usage_summary(
    redis:   Redis,
    user_id: str,
    plan:    Plan,
) -> dict:
    """
    Returns today's usage vs limits for all features.
    Uses a Redis pipeline to fetch all counters in a single roundtrip.
    
    Args:
        redis:   Redis client.
        user_id: Student's _id.
        plan:    Their plan.
    
    Returns:
        Dict compatible with UsageSummaryResponse Pydantic model.
    
    Example:
        {
          "plan": "free",
          "ai_chats": {"used": 7, "limit": 10, "remaining": 3},
          ...
        }
    """
    config = PLAN_CONFIGS[plan]

    # Fetch all 3 counters in ONE Redis roundtrip via pipeline
    keys = [_usage_key(user_id, f) for f in UsageFeature]
    async with redis.pipeline() as pipe:
        for key in keys:
            pipe.get(key)
        raw_values = await pipe.execute()

    # Parse results (None = 0 if key doesn't exist yet today)
    counts = {f: int(v or 0) for f, v in zip(UsageFeature, raw_values)}

    def slot(feature: UsageFeature, limit: Optional[int]) -> dict:
        used = counts[feature]
        return {
            "used":      used,
            "limit":     limit,
            "remaining": (limit - used) if limit is not None else None,
        }

    return {
        "plan":     plan.value,
        "reset_at": "midnight UTC",
        "ai_chats":      slot(UsageFeature.AI_CHAT,      config.ai_chats_per_day),
        "vision_audits": slot(UsageFeature.VISION_AUDIT, config.vision_audits_per_day),
        "hints":         slot(UsageFeature.HINT,         config.hints_per_day),
        "features": {
            "max_hint_layer": config.max_hint_layer,
            "max_subjects":   config.max_subjects,
            "streak_rewards": config.streak_rewards,
            "can_earn_gems":  config.can_earn_gems,
            "ai_model":       get_ai_model_for_plan(plan),
        },
    }


# ─────────────────────────────────────────────────────────────
# SECTION 6: INTERNAL HELPERS
# ─────────────────────────────────────────────────────────────

def _upgrade_message(plan: Plan, feature: UsageFeature, limit: int) -> str:
    """Builds a friendly, context-aware upgrade nudge for the UI."""
    messages = {
        UsageFeature.AI_CHAT: (
            f"You've used all {limit} AI chat sessions for today. "
            "Upgrade to Pro (₹99/month) for 100 sessions/day!"
        ),
        UsageFeature.VISION_AUDIT: (
            f"You've used all {limit} handwriting uploads for today. "
            "Pro gives you 20 uploads/day with full Gemini Vision."
        ),
        UsageFeature.HINT: (
            f"You've used all {limit} hints for today. "
            "Pro gives you 30 hints/day plus the full Logic Trace."
        ),
    }
    return messages.get(feature, "Upgrade to Pro for more access.")
