import time
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form

# --- Assuming you have these internal modules ---
# If these don't exist yet, I've added fallbacks below
try:
    from services.ai_service import get_socratic_response, analyze_solution_image
    from services.usage_service import get_usage_summary, increment_usage
    from schemas.ai import ChatRequest, HintRequest
    from auth.dependencies import get_current_user
except ImportError:
    # Fallback placeholders if you haven't built the services yet
    logging.warning("AI Help: Using mock services. Ensure services/ and schemas/ are implemented.")
    
# 1. THE CRITICAL FIX: Define the 'router' variable
router = APIRouter(
    prefix="/ai-help",
    tags=["AI Help"]
)

_log = logging.getLogger("ai_help")

# ── 1. USAGE ENDPOINT ──────────────────────────────────────────
@router.get("/usage")
async def get_usage(current_user: dict = Depends(lambda: {"id": "demo_user", "plan": "free"})):
    """
    Returns how many chats/hints the user has left for today.
    """
    try:
        # Replace with: return await get_usage_summary(current_user["id"])
        return {
            "plan": "free",
            "ai_chats": {"used": 2, "limit": 10},
            "vision_audits": {"used": 1, "limit": 5},
            "hints": {"used": 0, "limit": 5},
            "reset_at": "Tomorrow 00:00 UTC"
        }
    except Exception as e:
        _log.error(f"Usage fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch usage stats")

# ── 2. CHAT ENDPOINT ───────────────────────────────────────────
@router.post("/chat")
async def chat_with_tutor(payload: dict):
    """
    Socratic Chat: Guides the student instead of giving direct answers.
    """
    start_time = time.perf_counter()
    user_message = payload.get("message")
    history = payload.get("history", [])

    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required")

    try:
        # Replace with your actual Gemini/LLM service call
        # response = await get_socratic_response(user_message, history)
        response = f"To find the electric field on the axial line, remember that the field is the vector sum of fields from both charges. Where is the center of your dipole located?"
        
        latency = round((time.perf_counter() - start_time) * 1000, 2)
        
        return {
            "response": response,
            "provider_used": "gemini-1.5-flash",
            "latency_ms": latency
        }
    except Exception as e:
        _log.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail="AI Tutor is temporarily unavailable")

# ── 3. HINT ENDPOINT ───────────────────────────────────────────
@router.post("/hint")
async def get_hint(payload: dict):
    """
    Returns a hint based on the requested 'layer' (1=Concept, 2=Step, 3=Formula)
    """
    layer = payload.get("layer", 1)
    hints = {
        1: "Recall that an electric dipole consists of two equal and opposite charges.",
        2: "Calculate the distance from +q and -q to the axial point separately.",
        3: "The formula involves E = (1/4πε₀) * (2pr / (r²-a²)²)."
    }
    return {"hint": hints.get(layer, hints[1])}

# ── 4. VISION ENDPOINT ─────────────────────────────────────────
@router.post("/vision")
async def vision_audit(
    question_id: str = Form(...), 
    file: UploadFile = File(...)
):
    """
    Analyzes an uploaded image of handwritten work.
    """
    try:
        contents = await file.read()
        # Replace with: feedback = await analyze_solution_image(contents)
        return {
            "feedback": "Your vector directions for E1 and E2 look correct, but check your subtraction of the denominators.",
            "status": "success"
        }
    except Exception as e:
        _log.error(f"Vision audit failed: {e}")
        raise HTTPException(status_code=500, detail="Could not process image")