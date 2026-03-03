import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

# Make sure these match your project structure
from database import _get_db
from middleware.plan_guard import get_plan_info, PlanInfo

_log = logging.getLogger("progress")

# 1. CRITICAL: The variable must be exactly "router"
router = APIRouter(
    prefix="/progress",
    tags=["Progress"]
)

# 2. ENDPOINT DEFINITION
@router.get("/summary", summary="Get student progress summary")
async def get_progress_summary(
    plan_info: PlanInfo = Depends(get_plan_info),
) -> JSONResponse:
    """
    Returns the student's overall learning progress.
    Fetches from User_Smart_Profile.
    """
    try:
        users_col = _get_db()["User_Smart_Profile"]

        # Fetch only the specific fields needed for the dashboard
        user = await users_col.find_one(
            {"_id": plan_info.user_id},
            {
                "gamification":      1,
                "dashboard_insight": 1,
                "ai_report":         1,
                "topic_states":      1,
                "wallet":            1,
            }
        )

        if not user:
            # If the user doesn't exist in the DB yet, return empty defaults
            # rather than crashing the dashboard
            return JSONResponse({
                "gamification":      {"total_xp": 0, "streak": 0},
                "dashboard_insight": {},
                "ai_report":         {},
                "topic_states":      [],
                "wallet":            {"gems": 0},
            })

        # Return the actual data from MongoDB
        return JSONResponse({
            "gamification":      user.get("gamification", {}),
            "dashboard_insight": user.get("dashboard_insight", {}),
            "ai_report":         user.get("ai_report", {}),
            "topic_states":      user.get("topic_states", []),
            "wallet":            user.get("wallet", {}),
        })
        
    except Exception as e:
        _log.error(f"Failed to fetch progress: {e}")
        raise HTTPException(status_code=500, detail="Could not load progress data")
