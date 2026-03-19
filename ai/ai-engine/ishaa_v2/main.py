# # import sys
# # import os
# # sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# # import uuid
# # import time
# # import logging
# # import importlib
# # import traceback
# # from contextlib import asynccontextmanager

# # import structlog
# # import google.generativeai as genai
# # from fastapi import FastAPI, Request
# # from fastapi.responses import JSONResponse
# # from fastapi.middleware.cors import CORSMiddleware

# # from config import settings
# # from database import startup_db, shutdown_db

# # # ─────────────────────────────────────────────────────────────
# # # ROUTER IMPORTS — each done individually with explicit logging.
# # #
# # # PREVIOUS BUG: `from routers import auth, ai_help, progress, health`
# # # was one statement. If ai_help failed to import (e.g. because
# # # google-generativeai / anthropic / groq wasn't installed yet),
# # # Python raised ImportError for the ENTIRE statement. The router
# # # was silently absent → all /ai-help/* routes returned 404 while
# # # /auth/* worked fine.
# # #
# # # FIX: Import each router in a separate try/except block so:
# # #   1. A failure in one router does NOT prevent others loading.
# # #   2. The full traceback is printed — you see EXACTLY what's missing.
# # # ─────────────────────────────────────────────────────────────

# # logging.basicConfig(level=logging.INFO, format="%(message)s")
# # _log = logging.getLogger("startup")

# # _routers: dict = {}
# # for _router_name, _module_path in [
# #     ("auth",     "routers.auth"),
# #     ("ai_help",  "routers.ai_help"),
# #     ("progress", "routers.progress"),
# #     ("health",   "routers.health"),
# # ]:
# #     try:
# #         _mod = importlib.import_module(_module_path)
# #         _routers[_router_name] = _mod
# #         _log.info(f"  OK  router loaded: {_router_name}")
# #     except Exception as _exc:
# #         _log.error(f"  FAIL router failed to load: {_router_name} — {_exc}")
# #         _log.error(traceback.format_exc())

# # structlog.configure(
# #     processors=[
# #         structlog.processors.add_log_level,
# #         structlog.processors.TimeStamper(fmt="iso"),
# #         structlog.processors.JSONRenderer(),
# #     ],
# #     logger_factory=structlog.PrintLoggerFactory(),
# # )
# # logger = structlog.get_logger()


# # @asynccontextmanager
# # async def lifespan(app: FastAPI):
# #     await startup_db()
# #     genai.configure(api_key=settings.GOOGLE_API_KEY)
# #     logger.info("Gemini configured")
# #     logger.info("ishaa.ai ready")
# #     yield
# #     await shutdown_db()


# # app = FastAPI(
# #     title="ishaa.ai Backend",
# #     version="1.0.0",
# #     lifespan=lifespan,
# #     default_response_class=JSONResponse,
# # )

# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["*"],
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )


# # @app.middleware("http")
# # async def request_id_and_timing(request: Request, call_next):
# #     request_id = str(uuid.uuid4())
# #     structlog.contextvars.clear_contextvars()
# #     structlog.contextvars.bind_contextvars(request_id=request_id)
# #     start_time = time.perf_counter()
# #     response   = await call_next(request)
# #     process_time = time.perf_counter() - start_time
# #     logger.info(
# #         "request_processed",
# #         path=request.url.path,
# #         method=request.method,
# #         status_code=response.status_code,
# #         latency_ms=round(process_time * 1000, 2),
# #     )
# #     response.headers["X-Request-ID"] = request_id
# #     return response


# # # Register only the routers that loaded successfully.
# # # Wrapped in try/except — if include_router throws for one router,
# # # the others still register and the error is printed clearly.
# # for _name, _mod in _routers.items():
# #     try:
# #         app.include_router(_mod.router)
# #         _log.info(f"  OK  router registered: {_name}")
# #     except Exception as _exc:
# #         _log.error(f"  FAIL include_router failed for: {_name} — {_exc}")
# #         _log.error(traceback.format_exc())


# # # ── Debug endpoint: lists every route FastAPI actually registered ──
# # # Hit http://localhost:8000/debug/routes to see what's registered.
# # # Remove this in production.
# # @app.get("/debug/routes", include_in_schema=False)
# # def debug_routes():
# #     routes = []
# #     for route in app.routes:
# #         if hasattr(route, "methods"):
# #             routes.append({
# #                 "path":    route.path,
# #                 "methods": sorted(route.methods),
# #                 "name":    route.name,
# #             })
# #     return {"total": len(routes), "routes": sorted(routes, key=lambda r: r["path"])}

















































































# import sys
# import os

# # Ensure Python can resolve local module imports (config, database, etc.)
# # because this app is being mounted from the parent ai-engine directory.
# sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# import uuid
# import time
# import logging
# import importlib
# import traceback
# from contextlib import asynccontextmanager

# import structlog
# import google.generativeai as genai
# from fastapi import FastAPI, Request
# from fastapi.responses import JSONResponse
# from fastapi.middleware.cors import CORSMiddleware

# from config import settings
# from database import startup_db, shutdown_db

# # ─────────────────────────────────────────────────────────────
# # ROUTER IMPORTS 
# # ─────────────────────────────────────────────────────────────
# # Import each router in a separate try/except block so:
# #   1. A failure in one router does NOT prevent others loading.
# #   2. The full traceback is printed — you see EXACTLY what's missing.

# logging.basicConfig(level=logging.INFO, format="%(message)s")
# _log = logging.getLogger("startup")

# _routers: dict = {}
# for _router_name, _module_path in [
#     ("auth",     "routers.auth"),
#     ("ai_help",  "routers.ai_help"),
#     ("progress", "routers.progress"),
#     ("health",   "routers.health"),
# ]:
#     try:
#         _mod = importlib.import_module(_module_path)
#         _routers[_router_name] = _mod
#         _log.info(f"  OK  router loaded: {_router_name}")
#     except Exception as _exc:
#         _log.error(f"  FAIL router failed to load: {_router_name} — {_exc}")
#         _log.error(traceback.format_exc())

# # ─────────────────────────────────────────────────────────────
# # LOGGER SETUP
# # ─────────────────────────────────────────────────────────────
# structlog.configure(
#     processors=[
#         structlog.processors.add_log_level,
#         structlog.processors.TimeStamper(fmt="iso"),
#         structlog.processors.JSONRenderer(),
#     ],
#     logger_factory=structlog.PrintLoggerFactory(),
# )
# logger = structlog.get_logger()

# # ─────────────────────────────────────────────────────────────
# # LIFESPAN & STARTUP
# # ─────────────────────────────────────────────────────────────
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # 1. Start Database safely
#     try:
#         await startup_db()
#         logger.info("MongoDB connection established for Ishaa_v2")
#     except Exception as e:
#         logger.error(f"CRITICAL: Failed to connect to MongoDB: {e}")

#     # 2. Configure Gemini safely
#     if hasattr(settings, 'GOOGLE_API_KEY') and settings.GOOGLE_API_KEY:
#         try:
#             genai.configure(api_key=settings.GOOGLE_API_KEY)
#             logger.info("Gemini configured successfully")
#         except Exception as e:
#             logger.error(f"Failed to configure Gemini: {e}")
#     else:
#         logger.warning("GOOGLE_API_KEY is missing. AI Help features will fail.")
        
#     logger.info("ishaa.ai sub-application ready")
#     yield
#     await shutdown_db()


# # ─────────────────────────────────────────────────────────────
# # FASTAPI APP & MIDDLEWARE
# # ─────────────────────────────────────────────────────────────
# app = FastAPI(
#     title="ishaa.ai Backend (Phase 2)",
#     version="2.0.0",
#     lifespan=lifespan,
#     default_response_class=JSONResponse,
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.middleware("http")
# async def request_id_and_timing(request: Request, call_next):
#     request_id = str(uuid.uuid4())
#     structlog.contextvars.clear_contextvars()
#     structlog.contextvars.bind_contextvars(request_id=request_id)
    
#     start_time = time.perf_counter()
#     response   = await call_next(request)
#     process_time = time.perf_counter() - start_time
    
#     logger.info(
#         "request_processed",
#         path=request.url.path,
#         method=request.method,
#         status_code=response.status_code,
#         latency_ms=round(process_time * 1000, 2),
#     )
#     response.headers["X-Request-ID"] = request_id
#     return response

# # ─────────────────────────────────────────────────────────────
# # ROUTER REGISTRATION
# # ─────────────────────────────────────────────────────────────
# # Register only the routers that loaded successfully.
# for _name, _mod in _routers.items():
#     try:
#         app.include_router(_mod.router)
#         _log.info(f"  OK  router registered: {_name}")
#     except Exception as _exc:
#         _log.error(f"  FAIL include_router failed for: {_name} — {_exc}")
#         _log.error(traceback.format_exc())

# # ─────────────────────────────────────────────────────────────
# # DEBUG ENDPOINT
# # ─────────────────────────────────────────────────────────────
# # Hit http://localhost:8000/v2/ishaa/debug/routes to see what's registered.
# @app.get("/debug/routes", include_in_schema=False)
# def debug_routes():
#     routes = []
#     for route in app.routes:
#         if hasattr(route, "methods"):
#             routes.append({
#                 "path":    route.path,
#                 "methods": sorted(route.methods),
#                 "name":    route.name,
#             })
#     return {"total": len(routes), "routes": sorted(routes, key=lambda r: r["path"])}



# ==============================================================
# FILE: ishaa_v2/main.py
#
# PURPOSE:
#   Main entry point for the Ishaa V2 Sub-Application.
#   Designed to be safely mounted inside the main Phase 1 app.py.
# ==============================================================

import sys
import os

# CRITICAL: Ensure Python can resolve local module imports (config, database, etc.)
# because this app is being mounted from the parent ai-engine directory.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uuid
import time
import logging
import importlib
import traceback
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import startup_db, shutdown_db

# ─────────────────────────────────────────────────────────────
# ROUTER IMPORTS 
# ─────────────────────────────────────────────────────────────
# We load routers dynamically so a failure in one (e.g., missing SDK)
# doesn't crash the entire Penta-Core engine.

logging.basicConfig(level=logging.INFO, format="%(message)s")
_log = logging.getLogger("startup")

_routers: dict = {}
for _router_name, _module_path in [
    ("auth",     "routers.auth"),
    ("ai_help",  "routers.ai_help"),
    ("progress", "routers.progress"),
    ("health",   "routers.health"),
    ("admin",    "routers.admin"),    # <--- NEW: Your friend's Admin Router
]:
    try:
        _mod = importlib.import_module(_module_path)
        _routers[_router_name] = _mod
        _log.info(f"  OK  router loaded: {_router_name}")
    except Exception as _exc:
        _log.error(f"  FAIL router failed to load: {_router_name} — {_exc}")
        _log.error(traceback.format_exc())

# ─────────────────────────────────────────────────────────────
# LOGGER SETUP
# ─────────────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)
logger = structlog.get_logger()

# ─────────────────────────────────────────────────────────────
# LIFESPAN & STARTUP
# ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start Database (and Redis if your friend added it to startup_db) safely
    try:
        await startup_db()
        logger.info("MongoDB/Redis connections established for Ishaa_v2")
    except Exception as e:
        logger.error(f"CRITICAL: Failed to connect to databases: {e}")

    # Global Gemini config is removed here because your friend brilliantly 
    # moved it to lazy-loading inside ai_router.py! This makes startup much safer.
        
    logger.info("ishaa.ai sub-application ready")
    yield
    await shutdown_db()


# ─────────────────────────────────────────────────────────────
# FASTAPI APP & MIDDLEWARE
# ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="ishaa.ai Backend (Phase 2 - Admin Enabled)",
    version="2.1.0",
    lifespan=lifespan,
    default_response_class=JSONResponse,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_id_and_timing(request: Request, call_next):
    request_id = str(uuid.uuid4())
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)
    
    start_time = time.perf_counter()
    response   = await call_next(request)
    process_time = time.perf_counter() - start_time
    
    logger.info(
        "request_processed",
        path=request.url.path,
        method=request.method,
        status_code=response.status_code,
        latency_ms=round(process_time * 1000, 2),
    )
    response.headers["X-Request-ID"] = request_id
    return response

# ─────────────────────────────────────────────────────────────
# ROUTER REGISTRATION
# ─────────────────────────────────────────────────────────────
# Register only the routers that loaded successfully.
for _name, _mod in _routers.items():
    try:
        app.include_router(_mod.router)
        _log.info(f"  OK  router registered: {_name}")
    except Exception as _exc:
        _log.error(f"  FAIL include_router failed for: {_name} — {_exc}")
        _log.error(traceback.format_exc())

# ─────────────────────────────────────────────────────────────
# DEBUG ENDPOINT
# ─────────────────────────────────────────────────────────────
# Hit http://localhost:8000/v2/ishaa/debug/routes to see what's registered.
@app.get("/debug/routes", include_in_schema=False)
def debug_routes():
    routes = []
    for route in app.routes:
        if hasattr(route, "methods"):
            routes.append({
                "path":    route.path,
                "methods": sorted(route.methods),
                "name":    route.name,
            })
    return {"total": len(routes), "routes": sorted(routes, key=lambda r: r["path"])}