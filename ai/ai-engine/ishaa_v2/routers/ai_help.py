# import time
# import logging
# from typing import List, Optional
# from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form

# # --- Assuming you have these internal modules ---
# # If these don't exist yet, I've added fallbacks below
# try:
#     from services.ai_service import get_socratic_response, analyze_solution_image
#     from services.usage_service import get_usage_summary, increment_usage
#     from schemas.ai import ChatRequest, HintRequest
#     from auth.dependencies import get_current_user
# except ImportError:
#     # Fallback placeholders if you haven't built the services yet
#     logging.warning("AI Help: Using mock services. Ensure services/ and schemas/ are implemented.")
    
# # 1. THE CRITICAL FIX: Define the 'router' variable
# router = APIRouter(
#     prefix="/ai-help",
#     tags=["AI Help"]
# )

# _log = logging.getLogger("ai_help")

# # ── 1. USAGE ENDPOINT ──────────────────────────────────────────
# @router.get("/usage")
# async def get_usage(current_user: dict = Depends(lambda: {"id": "demo_user", "plan": "free"})):
#     """
#     Returns how many chats/hints the user has left for today.
#     """
#     try:
#         # Replace with: return await get_usage_summary(current_user["id"])
#         return {
#             "plan": "free",
#             "ai_chats": {"used": 2, "limit": 10},
#             "vision_audits": {"used": 1, "limit": 5},
#             "hints": {"used": 0, "limit": 5},
#             "reset_at": "Tomorrow 00:00 UTC"
#         }
#     except Exception as e:
#         _log.error(f"Usage fetch failed: {e}")
#         raise HTTPException(status_code=500, detail="Could not fetch usage stats")

# # ── 2. CHAT ENDPOINT ───────────────────────────────────────────
# @router.post("/chat")
# async def chat_with_tutor(payload: dict):
#     """
#     Socratic Chat: Guides the student instead of giving direct answers.
#     """
#     start_time = time.perf_counter()
#     user_message = payload.get("message")
#     history = payload.get("history", [])

#     if not user_message:
#         raise HTTPException(status_code=400, detail="Message is required")

#     try:
#         # Replace with your actual Gemini/LLM service call
#         # response = await get_socratic_response(user_message, history)
#         response = f"To find the electric field on the axial line, remember that the field is the vector sum of fields from both charges. Where is the center of your dipole located?"
        
#         latency = round((time.perf_counter() - start_time) * 1000, 2)
        
#         return {
#             "response": response,
#             "provider_used": "gemini-1.5-flash",
#             "latency_ms": latency
#         }
#     except Exception as e:
#         _log.error(f"Chat failed: {e}")
#         raise HTTPException(status_code=500, detail="AI Tutor is temporarily unavailable")

# # ── 3. HINT ENDPOINT ───────────────────────────────────────────
# @router.post("/hint")
# async def get_hint(payload: dict):
#     """
#     Returns a hint based on the requested 'layer' (1=Concept, 2=Step, 3=Formula)
#     """
#     layer = payload.get("layer", 1)
#     hints = {
#         1: "Recall that an electric dipole consists of two equal and opposite charges.",
#         2: "Calculate the distance from +q and -q to the axial point separately.",
#         3: "The formula involves E = (1/4πε₀) * (2pr / (r²-a²)²)."
#     }
#     return {"hint": hints.get(layer, hints[1])}

# # ── 4. VISION ENDPOINT ─────────────────────────────────────────
# @router.post("/vision")
# async def vision_audit(
#     question_id: str = Form(...), 
#     file: UploadFile = File(...)
# ):
#     """
#     Analyzes an uploaded image of handwritten work.
#     """
#     try:
#         contents = await file.read()
#         # Replace with: feedback = await analyze_solution_image(contents)
#         return {
#             "feedback": "Your vector directions for E1 and E2 look correct, but check your subtraction of the denominators.",
#             "status": "success"
#         }
#     except Exception as e:
#         _log.error(f"Vision audit failed: {e}")
#         raise HTTPException(status_code=500, detail="Could not process image")








# ==============================================================
# FILE: ishaa_v2/routers/ai_help.py
#
# PURPOSE:
#   Provides the HTTP endpoints for the AI Tutoring interface.
#   It connects the FastAPI router to the underlying ai_service 
#   and key_storage_service, passing the data cleanly.
# ==============================================================

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from bson import ObjectId

from database import get_db
from models.schemas import (
    StartSessionRequest, 
    ChatRequest, 
    HintRequest, 
    SaveKeyRequest,
    AIResponse, 
    ChatResponse
)
from services.ai_service import load_session
from services.key_storage_service import save_user_api_key, get_user_api_key, delete_user_api_key

# We import your existing auth dependency to identify who is making the request
from routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-help", tags=["AI Tutoring"])


# ── Helpers ───────────────────────────────────────────────────

async def _get_override_key(user_id: str) -> Optional[str]:
    """Helper to fetch the user's personal API key if they are on a free plan."""
    db = await get_db() if __import__('inspect').iscoroutinefunction(get_db) else get_db()
    return await get_user_api_key(db["User_Smart_Profile"], user_id)


# ── AI Tutoring Endpoints ─────────────────────────────────────

@router.post("/start", response_model=AIResponse, summary="Get an initial AI nudge")
async def start_session(
    body: StartSessionRequest,
    user: dict = Depends(get_current_user)
):
    user_id = str(user["_id"])
    db = await get_db() if __import__('inspect').iscoroutinefunction(get_db) else get_db()
    
    override_key = await _get_override_key(user_id)
    session = await load_session(db["questions"], db["User_Smart_Profile"], body.question_id, user_id)
    
    resp = await session.get_initial_nudge(override_api_key=override_key)
    
    return AIResponse(
        text=resp.text,
        provider_used=resp.provider_used.value,
        latency_ms=resp.latency_ms,
        fallback_used=resp.fallback_used
    )

from bson import ObjectId

@router.post("/chat", response_model=ChatResponse, summary="Send a message to the AI")
async def chat_turn(
    body: ChatRequest,
    user: dict = Depends(get_current_user)
):
    user_id = str(user["_id"])
    db = await get_db() if __import__('inspect').iscoroutinefunction(get_db) else get_db()
    
    override_key = await _get_override_key(user_id)
    
    # --- 🚀 PRODUCTION FIX: Auto-Provision General Chat ---
    # If the frontend sends the generic ID, ensure the "Master Context" exists in the DB
    if body.question_id == "000000000000000000000000":
        obj_id = ObjectId("000000000000000000000000")
        general_doc = await db["questions"].find_one({"_id": obj_id})
        
        # If it's the very first time someone uses General Chat, build the document silently
        if not general_doc:
            await db["questions"].insert_one({
                "_id": obj_id,
                "text": "General Science Discussion. The student is asking a freestyle question.",
                "subject": {"name": "General Science"},
                "chapter": {"name": "Freestyle AI Hub"},
                "topic": {"name": "General Inquiry"},
                "difficulty": "Medium",
                "cognitive_level": "Analyze",
                "optimum_time": 60,
                "formulas_used": []
            })
    # ------------------------------------------------------
    
    # Now load_session is guaranteed to succeed, whether it's a specific quiz ID or the General Hub!
    session = await load_session(db["questions"], db["User_Smart_Profile"], body.question_id, user_id)
    
    # Format history for the AI Service
    history_dicts = [{"role": msg.role, "parts": [msg.content]} for msg in body.history]
    
    resp = await session.chat(
        history=history_dicts,
        user_message=body.message,
        override_api_key=override_key
    )
    
    is_self_correction = session.detect_self_correction(body.message)
    misconception_data = await session.check_misconception(body.message)
    
    return ChatResponse(
        response=resp.text,
        provider_used=resp.provider_used.value,
        fallback_used=resp.fallback_used,
        latency_ms=resp.latency_ms,
        self_correction_bonus=is_self_correction,
        misconception_alert=misconception_data if misconception_data.get("is_misconception") else None
    )

@router.post("/hint", response_model=AIResponse, summary="Request a hint")
async def get_hint(
    body: HintRequest,
    user: dict = Depends(get_current_user)
):
    user_id = str(user["_id"])
    db = await get_db() if __import__('inspect').iscoroutinefunction(get_db) else get_db()
    
    override_key = await _get_override_key(user_id)
    session = await load_session(db["questions"], db["User_Smart_Profile"], body.question_id, user_id)
    
    resp = await session.get_hint(layer=body.layer, override_api_key=override_key)
    
    return AIResponse(
        text=resp.text,
        provider_used=resp.provider_used.value,
        latency_ms=resp.latency_ms,
        fallback_used=resp.fallback_used
    )


@router.post("/vision", response_model=AIResponse, summary="Upload handwritten work for AI check")
async def vision_check(
    question_id: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    user_id = str(user["_id"])
    db = await get_db() if __import__('inspect').iscoroutinefunction(get_db) else get_db()
    
    override_key = await _get_override_key(user_id)
    session = await load_session(db["questions"], db["User_Smart_Profile"], question_id, user_id)
    
    image_bytes = await file.read()
    resp = await session.vision_check(image_bytes=image_bytes, override_api_key=override_key)
    
    return AIResponse(
        text=resp.text,
        provider_used=resp.provider_used.value,
        latency_ms=resp.latency_ms,
        fallback_used=resp.fallback_used
    )


# ── Settings / BYOK Endpoints ─────────────────────────────────

@router.post("/settings/api-key", summary="Securely save personal API key (BYOK)")
async def save_api_key(
    body: SaveKeyRequest,
    user: dict = Depends(get_current_user)
):
    user_id = str(user["_id"])
    db = await get_db() if __import__('inspect').iscoroutinefunction(get_db) else get_db()
    
    success = await save_user_api_key(
        users_col=db["User_Smart_Profile"], 
        user_id=user_id, 
        raw_api_key=body.api_key, 
        provider=body.provider
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to save API key. User not found.")
    
    return {"status": "success", "message": "API key encrypted and securely stored."}


@router.delete("/settings/api-key", summary="Delete stored personal API key")
async def delete_api_key(
    user: dict = Depends(get_current_user)
):
    user_id = str(user["_id"])
    db = await get_db() if __import__('inspect').iscoroutinefunction(get_db) else get_db()
    
    success = await delete_user_api_key(db["User_Smart_Profile"], user_id)
    
    return {"status": "success", "message": "API key removed successfully." if success else "No key found to remove."}