"""
Run this from inside your backend/ folder:
    cd backend
    python debug_imports.py

It will print exactly which import is failing and why.
"""

import sys, os, traceback
from pathlib import Path

# Ensure backend/ is on sys.path (same as main.py does)
_BACKEND = Path(__file__).parent
sys.path.insert(0, str(_BACKEND))

# Load .env manually BEFORE importing anything, so config.py can read it.
# Search backend/.env first, then project root/.env
_env_candidates = [_BACKEND / ".env", _BACKEND.parent / ".env"]
for _env_path in _env_candidates:
    if _env_path.exists():
        from dotenv import load_dotenv
        load_dotenv(str(_env_path), override=False)
        print(f"\n  .env loaded from: {_env_path}\n")
        break
else:
    print("\n  WARNING: No .env file found — checks will fail unless vars are set in the shell\n")

steps = [
    ("config",                   "from config import settings"),
    ("database",                 "from database import startup_db, get_redis"),
    ("google-generativeai SDK",  "import google.generativeai as genai"),
    ("anthropic SDK",            "import anthropic"),
    ("groq SDK",                 "from groq import Groq"),
    ("plan_limits_service",      "from services.plan_limits_service import Plan, PLAN_CONFIGS"),
    ("plan_guard middleware",     "from middleware.plan_guard import get_plan_info, PlanInfo"),
    ("key_storage_service",      "from services.key_storage_service import get_user_api_key"),
    ("gamification_service",     "from services.gamification_service import award_xp"),
    ("persona_service",          "from services.persona_service import select_persona"),
    ("system_prompts",           "from prompts.system_prompts import build_system_prompt"),
    ("ai_router",                "from services.ai_router import socratic_chat, AIRouterResponse"),
    ("ai_service",               "from services.ai_service import load_session"),
    ("router: auth",             "from routers.auth import router"),
    ("router: health",           "from routers.health import router"),
    ("router: progress",         "from routers.progress import router"),
    ("router: ai_help",          "from routers.ai_help import router"),
]

print("\n" + "="*60)
print("  ishaa.ai — Import Diagnostic")
print("="*60 + "\n")

all_ok = True
for name, stmt in steps:
    try:
        exec(stmt)
        print(f"  ✅  {name}")
    except Exception as e:
        print(f"\n  ❌  FAILED: {name}")
        print(f"      Statement: {stmt}")
        print(f"      Error: {e}")
        print("\n--- Full traceback ---")
        traceback.print_exc()
        print("----------------------\n")
        all_ok = False

print()
if all_ok:
    print("✅ All imports succeeded. The problem is elsewhere.")
    print()
    # Extra check: verify each router actually has routes on it
    print("─" * 60)
    print("  Route registration check")
    print("─" * 60)
    for rname, rstmt in [
        ("auth",     "from routers.auth import router as _r"),
        ("health",   "from routers.health import router as _r"),
        ("progress", "from routers.progress import router as _r"),
        ("ai_help",  "from routers.ai_help import router as _r"),
    ]:
        try:
            ns = {}
            exec(rstmt, ns)
            r = ns["_r"]
            route_count = len(r.routes)
            paths = [getattr(route, "path", "?") for route in r.routes]
            print(f"  {rname:12s}  {route_count} routes: {paths}")
        except Exception as e:
            print(f"  {rname:12s}  ERROR: {e}")
else:
    print("❌ Fix the FAILED imports above, then restart uvicorn.")
print()







































