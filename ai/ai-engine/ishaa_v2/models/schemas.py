# ==============================================================
# FILE: backend/models/schemas.py
#
# PURPOSE:
#   All Pydantic v2 data models for the ishaa.ai API.
#   These serve two purposes:
#     1. REQUEST validation — FastAPI uses them to validate and
#        parse incoming JSON bodies before they reach route handlers.
#     2. INTERNAL data contracts — "context" models (QuestionContext,
#        UserContext) are slim read models passed between services,
#        containing only the fields actually needed for AI operations.
#
# WHY SLIM CONTEXT MODELS?
#   MongoDB documents for users/questions can be large (many fields).
#   Passing the full document through the service layer wastes memory
#   and makes every function signature depend on the full schema.
#   Instead, we project only needed fields from MongoDB and parse
#   them into these slim models — smaller footprint, clearer contracts.
#
# PYDANTIC v2 PERFORMANCE NOTES:
#   - model_config with `from_attributes=True` allows construction
#     from objects with attributes (not just dicts).
#   - `__slots__` is NOT used here (Pydantic v2 handles it internally).
#   - Validators use @field_validator (v2 syntax, replaces @validator).
# ==============================================================

from __future__ import annotations

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


# ─────────────────────────────────────────────────────────────
# SECTION 1: QUESTION MODELS
# ─────────────────────────────────────────────────────────────

class FormulaUsed(BaseModel):
    """
    A single formula entry from the question's formulas_used array.
    Mirrors the Mongoose sub-schema in the original database design.
    """
    latex:     str                          # e.g. "E = \\frac{1}{4\\pi\\epsilon_0} \\frac{q}{r^2}"
    name:      Optional[str] = None         # e.g. "Coulomb's Law"
    variables: Optional[list[str]] = None  # e.g. ["E", "q", "r"]


class QuestionContext(BaseModel):
    """
    Slim read model for questions — contains only what the AI service needs.
    Built by projecting specific fields from the `questions` MongoDB collection.
    
    Avoids loading heavy fields like full exam_metadata or analytics
    that are irrelevant to the AI tutoring session.
    """
    question_id:          str
    text:                 str
    question_type:        str              # MCQ | Numerical | Fill_Blank
    difficulty:           str              # Easy | Medium | Hard
    cognitive_level:      str              # Remember | Understand | Apply | Analyze
    formulas_used:        list[FormulaUsed] = Field(default_factory=list)
    explanation:          Optional[str]    = None   # The "secret" answer the AI guides toward
    discrimination_index: float            = 0.0   # 0–1; higher = more students get it wrong
    prerequisites:        list[dict]       = Field(default_factory=list)
    topic:                dict             = Field(default_factory=dict)
    chapter:              dict             = Field(default_factory=dict)
    subject:              dict             = Field(default_factory=dict)
    marks:                int              = 1
    optimum_time:         int              = 120   # Seconds


# ─────────────────────────────────────────────────────────────
# SECTION 2: USER MODELS
# ─────────────────────────────────────────────────────────────

class TopicState(BaseModel):
    """SRS (Spaced Repetition System) state for a single topic."""
    topic:           str
    memory_strength: float = 0.0   # 0–1
    next_review:     Optional[datetime] = None
    mastery_level:   float = 0.0   # 0–10


class UserContext(BaseModel):
    """
    Slim read model for users — contains only what AI services need.
    Built from the User_Smart_Profile collection.
    """
    user_id:              str
    name:                 str
    stream:               str               # Science | Commerce | Arts
    topic_states:         list[TopicState]  = Field(default_factory=list)
    wallet_gems:          int               = 0
    recent_accuracy:      float             = 0.5   # 0–1 (from dashboard_insight)
    predicted_percentile: Optional[float]   = None

    @field_validator("recent_accuracy")
    @classmethod
    def clamp_accuracy(cls, v: float) -> float:
        """Ensure accuracy stays in valid 0–1 range."""
        return max(0.0, min(1.0, v))


# ─────────────────────────────────────────────────────────────
# SECTION 3: API REQUEST / RESPONSE MODELS
#
# These are the shapes of JSON bodies FastAPI expects and returns.
# FastAPI auto-generates OpenAPI docs from these.
# ─────────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    """Request body for POST /ai-help/start"""
    question_id: str = Field(..., min_length=24, max_length=24,
                             description="MongoDB ObjectId of the question")


class ChatMessage(BaseModel):
    """A single message in the conversation history."""
    role:    str    # "user" | "model" | "assistant"
    content: str    # Message text

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        if v not in {"user", "model", "assistant"}:
            raise ValueError("role must be 'user', 'model', or 'assistant'")
        return v


class ChatRequest(BaseModel):
    """Request body for POST /ai-help/chat"""
    question_id: str  = Field(..., min_length=24, max_length=24)
    history:     list[ChatMessage] = Field(default_factory=list,
                                           max_length=50)   # Limit history depth
    message:     str  = Field(..., min_length=1, max_length=2000)

    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v: str) -> str:
        """
        Basic prompt injection guard.
        Strips leading/trailing whitespace and rejects messages that
        look like attempts to override the system prompt.
        """
        v = v.strip()
        # Flag messages that try to override AI instructions
        injection_patterns = [
            "ignore previous instructions",
            "ignore all instructions",
            "you are now",
            "new system prompt",
            "disregard your",
        ]
        lower = v.lower()
        if any(p in lower for p in injection_patterns):
            raise ValueError("Message contains disallowed content")
        return v


class HintRequest(BaseModel):
    """Request body for POST /ai-help/hint"""
    question_id: str = Field(..., min_length=24, max_length=24)
    layer:       int = Field(..., ge=1, le=3,
                             description="1=Gist (free), 2=Blueprint (5💎), 3=LogicTrace (15💎)")


class SaveKeyRequest(BaseModel):
    """Request body for POST /ai-help/settings/api-key"""
    api_key:  str = Field(..., min_length=20, max_length=200)
    provider: str = Field(default="gemini")

    @field_validator("api_key")
    @classmethod
    def validate_gemini_key_format(cls, v: str) -> str:
        """
        Basic format check for Gemini keys (start with 'AIza').
        Catches obvious paste errors before hitting the DB.
        """
        v = v.strip()
        if not v.startswith("AIza"):
            raise ValueError("Gemini API keys must start with 'AIza'")
        return v


# ─────────────────────────────────────────────────────────────
# SECTION 4: RESPONSE MODELS
#
# Explicit response models improve API documentation quality
# and help FastAPI serialize responses correctly.
# ─────────────────────────────────────────────────────────────

class AIResponse(BaseModel):
    """Unified response from any AI provider call."""
    text:          str
    provider_used: str    # "gemini" | "claude" | "groq"
    latency_ms:    float
    fallback_used: bool   # True if primary provider failed


class ChatResponse(BaseModel):
    """Response from POST /ai-help/chat"""
    response:              str
    provider_used:         str
    fallback_used:         bool
    latency_ms:            float
    self_correction_bonus: bool
    misconception_alert:   Optional[dict] = None


class UsageSlot(BaseModel):
    """Usage data for a single feature."""
    used:      int
    limit:     Optional[int]   # None = unlimited
    remaining: Optional[int]   # None = unlimited


class UsageSummaryResponse(BaseModel):
    """Response from GET /ai-help/usage"""
    plan:          str
    reset_at:      str
    ai_chats:      UsageSlot
    vision_audits: UsageSlot
    hints:         UsageSlot
    features:      dict[str, Any]
