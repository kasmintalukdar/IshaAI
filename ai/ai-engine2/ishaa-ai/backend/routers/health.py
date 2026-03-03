# ==============================================================
# FILE: backend/routers/health.py
# ==============================================================

import time
import logging

from fastapi import APIRouter
# FIX: UJSONResponse causes AssertionError in this FastAPI version.
# Use standard JSONResponse instead.
from fastapi.responses import JSONResponse

from database import _get_mongo_client, get_redis
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Liveness probe")
async def health() -> JSONResponse:
    """
    Simple liveness check. Returns 200 immediately.
    No database calls — responds in microseconds.
    """
    return JSONResponse({
        "status":  "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "env":     settings.APP_ENV,
    })


@router.get("/health/ready", summary="Readiness probe")
async def readiness() -> JSONResponse:
    """
    Full readiness check. Pings MongoDB and Redis.
    Returns 200 if all dependencies are healthy, 503 if degraded.
    """
    results = {}
    all_ok  = True
    start   = time.perf_counter()

    # ── MongoDB ping ─────────────────────────────────────────
    try:
        await _get_mongo_client().admin.command("ping")
        results["mongodb"] = {"status": "ok"}
    except Exception as e:
        results["mongodb"] = {"status": "error", "detail": str(e)[:100]}
        all_ok = False

    # ── Redis ping ────────────────────────────────────────────
    try:
        redis = await get_redis()
        await redis.ping()
        results["redis"] = {"status": "ok"}
    except Exception as e:
        results["redis"] = {"status": "error", "detail": str(e)[:100]}
        all_ok = False

    total_ms = round((time.perf_counter() - start) * 1000)

    return JSONResponse(
        {
            "status":     "ready" if all_ok else "degraded",
            "checks":     results,
            "latency_ms": total_ms,
        },
        status_code=200 if all_ok else 503,
    )
