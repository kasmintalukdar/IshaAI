# # ==============================================================
# # FILE: backend/config.py
# #
# # PURPOSE:
# #   Central configuration module. Reads all environment variables,
# #   validates them with Pydantic, and exposes a single `settings`
# #   singleton used throughout the app.
# #
# # HOW IT WORKS:
# #   Pydantic's BaseSettings automatically reads from environment
# #   variables and from a .env file. If a required variable is
# #   missing, the app crashes at startup with a clear error —
# #   this is the "fail-fast" principle. Better to crash early
# #   than silently fail later during a student's session.
# #
# # USAGE:
# #   from config import settings
# #   settings.MONGODB_URI  # type-safe, validated
# #
# # PERFORMANCE NOTE:
# #   `settings` is a module-level singleton — it is created once
# #   when the module is first imported and reused everywhere.
# #   No repeated disk reads or env lookups at request time.
# # ==============================================================

# from functools import lru_cache
# from pathlib import Path
# from typing import Literal
# from pydantic import Field, field_validator
# from pydantic_settings import BaseSettings, SettingsConfigDict

# # FIX: Compute the .env path relative to THIS file (config.py) so it works
# # regardless of what directory uvicorn / python is launched from.
# # Search order: backend/.env first, then project root .env as fallback.
# _THIS_DIR    = Path(__file__).parent          # backend/
# _PROJECT_DIR = _THIS_DIR.parent               # ishaa-ai/  (project root)
# _ENV_FILE    = _THIS_DIR / ".env"             # backend/.env
# if not _ENV_FILE.exists():
#     _ENV_FILE = _PROJECT_DIR / ".env"         # fallback: project root .env
# # If neither exists, pydantic will still read from real environment variables.


# class Settings(BaseSettings):
#     """
#     Application settings loaded from environment variables / .env file.
#     All fields are type-annotated and validated by Pydantic on startup.
#     """

#     # ── App ──────────────────────────────────────────────────────
#     APP_ENV:     Literal["development", "staging", "production"] = "development"
#     APP_NAME:    str = "ishaa-ai"
#     APP_VERSION: str = "1.0.0"
#     DEBUG:       bool = False

#     # ── MongoDB ──────────────────────────────────────────────────
#     MONGODB_URI:           str   = Field(..., min_length=10)   # Required — no default
#     MONGODB_DB_NAME:       str   = "ishaa_db"
#     MONGODB_MAX_POOL_SIZE: int   = 50   # Connections per worker process
#     MONGODB_MIN_POOL_SIZE: int   = 5

#     # ── Redis ────────────────────────────────────────────────────
#     REDIS_URL:             str   = "redis://localhost:6379/0"
#     REDIS_MAX_CONNECTIONS: int   = 20

#     # ── AI Providers ─────────────────────────────────────────────
#     GOOGLE_API_KEY:    str = Field(..., min_length=10)  # Required
#     ANTHROPIC_API_KEY: str = Field(..., min_length=10)  # Required
#     GROQ_API_KEY:      str = Field(..., min_length=10)  # Required

#     # ── Auth ─────────────────────────────────────────────────────
#     JWT_SECRET:         str = Field(..., min_length=32)  # Required, minimum 32 chars
#     JWT_ALGORITHM:      str = "HS256"
#     JWT_EXPIRE_MINUTES: int = 10080  # 7 days

#     # ── Encryption ───────────────────────────────────────────────
#     KEY_ENCRYPTION_SECRET: str = Field(..., min_length=32)  # Required

#     # ── Rate Limiting ────────────────────────────────────────────
#     RATE_LIMIT_GLOBAL_RPM: int = 300   # Global: requests per minute per IP
#     RATE_LIMIT_AI_RPM:     int = 20    # AI endpoints: requests per minute per user

#     # ── CORS ─────────────────────────────────────────────────────
#     CORS_ORIGINS: str = "http://localhost:8501,http://localhost:3000"

#     @field_validator("JWT_SECRET")
#     @classmethod
#     def jwt_secret_strong_enough(cls, v: str) -> str:
#         """Enforce minimum JWT secret length to prevent weak secrets."""
#         if len(v) < 32:
#             raise ValueError("JWT_SECRET must be at least 32 characters for security")
#         return v

#     @property
#     def cors_origins_list(self) -> list[str]:
#         """Parse comma-separated CORS origins string into a list."""
#         return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

#     @property
#     def is_production(self) -> bool:
#         """Convenience flag — used to toggle production-only behaviors."""
#         return self.APP_ENV == "production"

#     # FIX: Use the absolute _ENV_FILE path computed at module level — not ".env".
#     # ".env" is resolved from CWD, so it breaks depending on where uvicorn is run.
#     model_config = SettingsConfigDict(
#         env_file=str(_ENV_FILE),
#         env_file_encoding="utf-8",
#         extra="ignore",
#         case_sensitive=True,
#     )


# @lru_cache(maxsize=1)
# def get_settings() -> Settings:
#     """
#     Returns the cached Settings singleton.
#     Using lru_cache ensures the .env file is parsed only once.
    
#     Usage:
#         from config import settings   # module-level singleton (preferred)
#         # OR
#         from config import get_settings
#         settings = get_settings()    # explicit cache call
#     """
#     return Settings()


# # Module-level singleton — import this directly everywhere
# settings: Settings = get_settings()


























# ==============================================================
# FILE: ishaa_v2/config.py
#
# PURPOSE:
#   Central configuration module. Reads all environment variables,
#   validates them with Pydantic, and exposes a single `settings`
#   singleton used throughout the app.
#
# HOW IT WORKS:
#   Pydantic's BaseSettings automatically reads from environment
#   variables and from a .env file. If a required variable is
#   missing, the app crashes at startup with a clear error —
#   this is the "fail-fast" principle. Better to crash early
#   than silently fail later during a student's session.
#
# USAGE:
#   from config import settings
#   settings.MONGODB_URI  # type-safe, validated
#
# PERFORMANCE NOTE:
#   `settings` is a module-level singleton — it is created once
#   when the module is first imported and reused everywhere.
#   No repeated disk reads or env lookups at request time.
# ==============================================================

from functools import lru_cache
from pathlib import Path
from typing import Literal
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# FIX: Compute the .env path relative to THIS file (config.py) so it works
# regardless of what directory uvicorn / python is launched from.
# Search order: backend/.env first, then project root .env as fallback.
# For your specific setup, we want it to look in E:\isha.ai\ai\ai-engine\.env
_THIS_DIR    = Path(__file__).parent          # ishaa_v2/
_PARENT_DIR  = _THIS_DIR.parent               # ai-engine/
_ENV_FILE    = _PARENT_DIR / ".env"           # ai-engine/.env


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables / .env file.
    All fields are type-annotated and validated by Pydantic on startup.
    """

    # ── App ──────────────────────────────────────────────────────
    APP_ENV:     Literal["development", "staging", "production"] = "development"
    APP_NAME:    str = "ishaa-ai"
    APP_VERSION: str = "1.0.0"
    DEBUG:       bool = False

    # ── MongoDB ──────────────────────────────────────────────────
    MONGODB_URI:           str   = Field(..., min_length=10)   # Required — no default
    MONGODB_DB_NAME:       str   = "ishaa_db"
    MONGODB_DB:            str | None = None  # Backward-compatible alias
    MONGODB_MAX_POOL_SIZE: int   = 50   # Connections per worker process
    MONGODB_MIN_POOL_SIZE: int   = 5

    # ── Redis ────────────────────────────────────────────────────
    REDIS_URL:             str   = "redis://localhost:6379/0"
    REDIS_MAX_CONNECTIONS: int   = 20

    # ── AI Providers ─────────────────────────────────────────────
    # Not using Field(...) makes them optional, allowing BYOK
    GOOGLE_API_KEY:    str = ""
    ANTHROPIC_API_KEY: str = ""
    GROQ_API_KEY:      str = ""

    # ── Auth ─────────────────────────────────────────────────────
    JWT_SECRET:         str = Field(..., min_length=32)  # Required, minimum 32 chars
    JWT_ALGORITHM:      str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    # ── Encryption ───────────────────────────────────────────────
    KEY_ENCRYPTION_SECRET: str = Field(..., min_length=32)  # Required

    # ── Admin ──────────────────────────────────────────────────
    ADMIN_SECRET: str = ""  # Empty = admin endpoints disabled

    # ── Rate Limiting ────────────────────────────────────────────
    RATE_LIMIT_GLOBAL_RPM: int = 300   # Global: requests per minute per IP
    RATE_LIMIT_AI_RPM:     int = 20    # AI endpoints: requests per minute per user

    # ── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:8501,http://localhost:3000,http://localhost:4200"

    @field_validator("JWT_SECRET")
    @classmethod
    def jwt_secret_strong_enough(cls, v: str) -> str:
        """Enforce minimum JWT secret length to prevent weak secrets."""
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters for security")
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins string into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        """Convenience flag — used to toggle production-only behaviors."""
        return self.APP_ENV == "production"

    @model_validator(mode="after")
    def apply_backward_compatible_aliases(self):
        # Support legacy .env naming used in older local setups.
        if self.MONGODB_DB:
            self.MONGODB_DB_NAME = self.MONGODB_DB
        return self

    # FIX: Use the absolute _ENV_FILE path computed at module level — not ".env".
    # ".env" is resolved from CWD, so it breaks depending on where uvicorn is run.
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Returns the cached Settings singleton.
    Using lru_cache ensures the .env file is parsed only once.
    
    Usage:
        from config import settings   # module-level singleton (preferred)
        # OR
        from config import get_settings
        settings = get_settings()    # explicit cache call
    """
    return Settings()


# Module-level singleton — import this directly everywhere
settings: Settings = get_settings()













