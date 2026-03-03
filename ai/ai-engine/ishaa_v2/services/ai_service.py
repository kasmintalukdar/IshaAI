# ==============================================================
# FILE: backend/services/ai_service.py
#
# PURPOSE:
#   Orchestrates AI tutoring sessions. Fetches question and user
#   context from MongoDB, builds the system prompt, and exposes
#   clean async methods for each interaction type (chat, vision,
#   hint, misconception check).
#
# STATELESS DESIGN:
#   AIHelpSession holds NO persistent state between requests.
#   The conversation history is passed by the CLIENT on every turn
#   and discarded after the response is sent. This means:
#     - No server-side session storage needed
#     - Any worker can handle any request (horizontal scaling)
#     - No memory leaks from abandoned sessions
#
# PERFORMANCE:
#   load_session() makes TWO MongoDB queries (question + user).
#   Both use projections to fetch only needed fields:
#     Question: ~15 fields out of 25+
#     User:     ~8 fields out of 30+
#   This reduces data transfer from ~5KB to ~1KB per session load.
#
#   In production, consider adding a short-lived Redis cache
#   (TTL=5min) for question data — questions don't change, so
#   repeated lookups for the same question waste MongoDB reads.
# ==============================================================

import logging
import json
import re
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorCollection

from models.schemas import QuestionContext, UserContext, FormulaUsed, TopicState
from services.persona_service import select_persona
from prompts.system_prompts import build_system_prompt, build_hint_prompt
from services.ai_router import (
    AIRouterResponse, socratic_chat, vision_audit, generate_hint
)

logger = logging.getLogger(__name__)

# MongoDB projections — fetch only fields needed for AI context
_QUESTION_PROJECTION = {
    "text": 1, "type": 1, "difficulty": 1, "cognitive_level": 1,
    "formulas_used": 1, "explanation": 1, "discrimination_index": 1,
    "prerequisites": 1, "topic": 1, "chapter": 1, "subject": 1,
    "marks": 1, "optimum_time": 1,
}

_USER_PROJECTION = {
    "profile.name": 1, "profile.stream": 1,
    "topic_states": 1, "wallet.gems": 1,
    "dashboard_insight.status.recent_accuracy": 1,
    "ai_report.predicted_percentile": 1,
    "subscription.plan": 1,
}

# Phrases that indicate a student corrected their own mistake
_SELF_CORRECTION_PHRASES = frozenset([
    "my mistake", "i see now", "got it", "i was wrong",
    "oh i see", "that makes sense", "i understand now",
    "you're right", "i see the error", "found it",
])


class AIHelpSession:
    """
    Represents a single AI tutoring interaction context.
    
    Instantiated per request via load_session(). Does NOT persist
    between requests — all state is either in the database or
    passed explicitly by the client.
    
    Attributes:
        question_ctx:  Slim question read model (fetched from MongoDB).
        user_ctx:      Slim user read model (fetched from MongoDB).
        persona:       Selected teaching persona dict.
        system_prompt: Fully built system prompt for this session.
    """

    __slots__ = ("question_ctx", "user_ctx", "persona", "system_prompt")

    def __init__(self, question_ctx: QuestionContext, user_ctx: UserContext) -> None:
        self.question_ctx  = question_ctx
        self.user_ctx      = user_ctx
        self.persona       = select_persona(user_ctx)
        self.system_prompt = build_system_prompt(question_ctx, user_ctx, self.persona)

    async def get_initial_nudge(
        self,
        override_api_key: Optional[str] = None,
    ) -> AIRouterResponse:
        """
        Generates a personalized opening message when the student
        first opens AI Help. This is NOT counted as a chat turn.
        
        The nudge is personalized based on:
          - Student's mastery level for this specific topic
          - Question content preview (first 200 chars)
          - Persona (Intuitionist vs Challenger)
        
        Args:
            override_api_key: Student's personal API key (free plan).
        
        Returns:
            AIRouterResponse with the opening message text.
        """
        topic_name = self.question_ctx.topic.get("name", "this topic")
        mastery    = next(
            (t.mastery_level for t in self.user_ctx.topic_states
             if t.topic == topic_name),
            0.0
        )

        prompt = (
            f"Generate a warm, personalized 2–3 sentence opening for student '{self.user_ctx.name}'. "
            f"Their mastery of '{topic_name}' is {mastery:.1f}/10. "
            f"This question is about: '{self.question_ctx.text[:200]}'. "
            f"Adapt tone to your persona. End with one open-ended question "
            f"that starts the discovery process."
        )

        return await socratic_chat(
            system_prompt    = self.system_prompt,
            history          = [],
            user_message     = prompt,
            override_api_key = override_api_key,
        )

    async def chat(
        self,
        history:          list[dict],
        user_message:     str,
        override_api_key: Optional[str] = None,
    ) -> AIRouterResponse:
        """
        Main conversational exchange. Routes through the multi-provider
        AI router with automatic fallback.
        
        Args:
            history:          Full conversation history (client-managed).
            user_message:     Student's current message.
            override_api_key: Student's personal API key (free plan).
        
        Returns:
            AIRouterResponse with the AI's Socratic reply.
        """
        return await socratic_chat(
            system_prompt    = self.system_prompt,
            history          = history,
            user_message     = user_message,
            override_api_key = override_api_key,
        )

    async def vision_check(
        self,
        image_bytes:      bytes,
        override_api_key: Optional[str] = None,
    ) -> AIRouterResponse:
        """
        Analyzes the student's handwritten work using Gemini Vision.
        
        Args:
            image_bytes:      Raw bytes from the uploaded image file.
            override_api_key: Student's personal API key (free plan).
        
        Returns:
            AIRouterResponse with targeted feedback on the student's work.
        """
        formulas_str = "; ".join(
            f"{f.name}: {f.latex}" for f in self.question_ctx.formulas_used
        )

        prompt = (
            f"Analyze the student's handwritten work for:\n"
            f"\"{self.question_ctx.text[:300]}\"\n\n"
            f"Allowed formulas: {formulas_str}\n"
            f"Secret answer direction: {self.question_ctx.explanation or 'derive logically'}\n\n"
            f"Your response must:\n"
            f"1. Identify exactly where the student's logic diverges from the correct approach.\n"
            f"2. Start by celebrating what they got right.\n"
            f"3. Ask ONE guiding question about the divergence point — never state the correction directly.\n"
            f"Keep response to 3–4 sentences."
        )

        return await vision_audit(
            system_prompt    = self.system_prompt,
            user_message     = prompt,
            image_bytes      = image_bytes,
            override_api_key = override_api_key,
        )

    async def get_hint(
        self,
        layer:            int,
        override_api_key: Optional[str] = None,
    ) -> AIRouterResponse:
        """
        Generates a density-layer hint.
        Layer 1: Conceptual gist (free, uses cheapest provider).
        Layer 2: Formula blueprint (5 gems, uses cheapest provider).
        Layer 3: Logic trace (15 gems, uses cheapest provider).
        
        Hints route to cheapest provider (Groq first) to save cost
        — they're simpler prompts that don't need top-tier models.
        
        Args:
            layer:            1, 2, or 3.
            override_api_key: Student's personal API key (free plan).
        
        Returns:
            AIRouterResponse with hint content.
        """
        hint_prompt = build_hint_prompt(layer, self.question_ctx, self.user_ctx)
        return await generate_hint(
            system_prompt    = self.system_prompt,
            hint_prompt      = hint_prompt,
            override_api_key = override_api_key,
        )

    def detect_self_correction(self, message: str) -> bool:
        """
        Heuristic check: did the student acknowledge correcting their
        own mistake? Used to award the Self-Correction XP bonus.
        
        Uses a frozen set for O(1) substring lookup.
        
        Args:
            message: Student's raw message text.
        
        Returns:
            True if a self-correction phrase is detected.
        """
        lower = message.lower()
        return any(phrase in lower for phrase in _SELF_CORRECTION_PHRASES)

    async def check_misconception(self, student_text: str) -> dict:
        """
        Checks if the student's answer matches a known common trap.
        Only triggered if discrimination_index > 0.4 (question has
        a well-documented wrong-answer pattern).
        
        Returns a structured dict rather than raising, so the caller
        can optionally include the alert in the response.
        
        Args:
            student_text: The student's message or answer text.
        
        Returns:
            {"is_misconception": bool, "trap_description": str}
        """
        # Only check for questions with known traps (saves an LLM call)
        if self.question_ctx.discrimination_index <= 0.4:
            return {"is_misconception": False, "trap_description": ""}

        prompt = (
            f"Question: {self.question_ctx.text}\n"
            f"Student's attempt: {student_text}\n\n"
            f"The discrimination index is {self.question_ctx.discrimination_index:.2f} "
            f"(this question has a well-known common trap).\n"
            f"In one sentence: did the student fall into the common misconception?\n"
            f"Respond ONLY as valid JSON: "
            f'{{\"is_misconception\": true/false, \"trap_description\": \"...\"}}'
        )

        try:
            response = await socratic_chat(
                system_prompt = self.system_prompt,
                history       = [],
                user_message  = prompt,
            )
            # Extract JSON from response (model might add extra text)
            match = re.search(r"\{[^}]+\}", response.text, re.DOTALL)
            if match:
                return json.loads(match.group())
        except Exception as e:
            logger.warning("misconception_check_failed", error=str(e))

        return {"is_misconception": False, "trap_description": ""}


# ─────────────────────────────────────────────────────────────
# SESSION FACTORY
#
# This is the function routers call to get a session.
# It fetches question + user from MongoDB using projections.
# ─────────────────────────────────────────────────────────────

async def load_session(
    questions_col: AsyncIOMotorCollection,
    users_col:     AsyncIOMotorCollection,
    question_id:   str,
    user_id:       str,
) -> AIHelpSession:
    """
    Builds an AIHelpSession by loading context from MongoDB.
    
    Uses field projections to load only what's needed — reduces
    data transfer from ~5KB to ~1KB per call.
    
    Args:
        questions_col: Motor collection for questions.
        users_col:     Motor collection for User_Smart_Profile.
        question_id:   MongoDB ObjectId string (24 hex chars).
        user_id:       User _id string.
    
    Returns:
        Initialized AIHelpSession ready for use.
    
    Raises:
        HTTPException 400: If question_id is not a valid ObjectId.
        HTTPException 404: If question or user not found.
    """
    # Validate ObjectId format before hitting MongoDB
    try:
        oid = ObjectId(question_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid question_id format")

    # Fetch question and user concurrently — saves one round-trip latency
    import asyncio
    q_doc, u_doc = await asyncio.gather(
        questions_col.find_one({"_id": oid}, _QUESTION_PROJECTION),
        users_col.find_one({"_id": user_id}, _USER_PROJECTION),
    )

    if not q_doc:
        raise HTTPException(status_code=404, detail=f"Question {question_id} not found")
    if not u_doc:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    # Build QuestionContext from MongoDB document
    question_ctx = QuestionContext(
        question_id          = str(q_doc["_id"]),
        text                 = q_doc["text"],
        question_type        = q_doc.get("type", "MCQ"),
        difficulty           = q_doc.get("difficulty", "Medium"),
        cognitive_level      = q_doc.get("cognitive_level", "Understand"),
        formulas_used        = [FormulaUsed(**f) for f in q_doc.get("formulas_used", [])],
        explanation          = q_doc.get("explanation"),
        discrimination_index = q_doc.get("discrimination_index", 0.0),
        prerequisites        = q_doc.get("prerequisites", []),
        topic                = q_doc.get("topic", {}),
        chapter              = q_doc.get("chapter", {}),
        subject              = q_doc.get("subject", {}),
        marks                = q_doc.get("marks", 1),
        optimum_time         = q_doc.get("optimum_time", 120),
    )

    # Build UserContext from MongoDB document
    topic_states = [
        TopicState(**ts) for ts in u_doc.get("topic_states", [])
    ]
    recent_accuracy = (
        u_doc.get("dashboard_insight", {})
             .get("status", {})
             .get("recent_accuracy", 0.5)
    )

    user_ctx = UserContext(
        user_id              = str(u_doc["_id"]),
        name                 = u_doc["profile"]["name"],
        stream               = u_doc["profile"].get("stream", "Science"),
        topic_states         = topic_states,
        wallet_gems          = u_doc.get("wallet", {}).get("gems", 0),
        recent_accuracy      = recent_accuracy,
        predicted_percentile = u_doc.get("ai_report", {}).get("predicted_percentile"),
    )

    return AIHelpSession(question_ctx, user_ctx)
