# # ==============================================================
# # FILE: backend/services/ai_router.py
# # ==============================================================

# import asyncio
# import time
# import logging
# from typing import Optional
# from dataclasses import dataclass
# from enum import Enum

# # FIX: Removed top-level SDK imports of google.generativeai, anthropic, and groq.
# # Previously these were imported at module level:
# #
# #   import google.generativeai as genai   ← crashes if package not installed
# #   import anthropic                       ← crashes if package not installed
# #   from groq import Groq                  ← crashes if package not installed
# #
# # If ANY of these packages is missing or has an import error, the entire
# # ai_router.py module fails to import. This cascades:
# #   ai_router.py FAIL → ai_service.py FAIL → ai_help.py FAIL → router never registered
# # Result: all /ai-help/* routes return 404 while /auth/* works fine.
# #
# # FIX: Imports are now LAZY — done inside each caller function just before use.
# # The module always loads successfully. Only the specific provider fails at
# # call time (with a clean error) if its SDK isn't installed.

# from config import settings
# from database import get_redis

# logger = logging.getLogger(__name__)


# # ─────────────────────────────────────────────────────────────
# # SECTION 1: PROVIDER CONFIGURATION
# # ─────────────────────────────────────────────────────────────

# class Provider(str, Enum):
#     GEMINI = "gemini"
#     CLAUDE = "claude"
#     GROQ   = "groq"


# @dataclass(frozen=True)
# class ProviderConfig:
#     name:            Provider
#     model:           str
#     cost_per_1k:     float
#     timeout_sec:     int
#     supports_vision: bool
#     priority:        int


# PROVIDER_CONFIGS: list[ProviderConfig] = [
#     ProviderConfig(
#         name=Provider.GEMINI, model="gemini-2.5-flash",
#         cost_per_1k=0.00035, timeout_sec=15,
#         supports_vision=True, priority=1,
#     ),
#     ProviderConfig(
#         name=Provider.CLAUDE, model="claude-haiku-4-5-20251001",
#         cost_per_1k=0.00080, timeout_sec=20,
#         supports_vision=False, priority=2,
#     ),
#     ProviderConfig(
#         name=Provider.GROQ, model="llama-3.3-70b-versatile",
#         cost_per_1k=0.00008, timeout_sec=10,
#         supports_vision=False, priority=3,
#     ),
# ]

# _CONFIG_BY_NAME: dict[Provider, ProviderConfig] = {c.name: c for c in PROVIDER_CONFIGS}


# # ─────────────────────────────────────────────────────────────
# # SECTION 2: REDIS-BACKED HEALTH REGISTRY
# # ─────────────────────────────────────────────────────────────

# _HEALTH_KEY_PREFIX = "ph:"
# _FAILURE_THRESHOLD = 3
# _COOLDOWN_SECONDS  = 60


# async def _get_failures(provider: Provider) -> tuple[int, float]:
#     redis = await get_redis()
#     key   = f"{_HEALTH_KEY_PREFIX}{provider.value}"
#     data  = await redis.hgetall(key)
#     return int(data.get("failures", 0)), float(data.get("last_fail", 0.0))


# async def _record_success(provider: Provider, latency_ms: float) -> None:
#     redis   = await get_redis()
#     key     = f"{_HEALTH_KEY_PREFIX}{provider.value}"
#     current = await redis.hget(key, "avg_latency") or "0"
#     new_avg = float(current) * 0.8 + latency_ms * 0.2
#     await redis.hset(key, mapping={"failures": 0, "avg_latency": round(new_avg, 1)})


# async def _record_failure(provider: Provider) -> None:
#     redis = await get_redis()
#     key   = f"{_HEALTH_KEY_PREFIX}{provider.value}"
#     async with redis.pipeline(transaction=True) as pipe:
#         pipe.hincrby(key, "failures", 1)
#         pipe.hset(key, "last_fail", time.monotonic())
#         pipe.expire(key, 300)
#         await pipe.execute()


# async def _is_available(provider: Provider) -> bool:
#     failures, last_fail = await _get_failures(provider)
#     if failures < _FAILURE_THRESHOLD:
#         return True
#     elapsed = time.monotonic() - last_fail
#     if elapsed >= _COOLDOWN_SECONDS:
#         redis = await get_redis()
#         await redis.hset(f"{_HEALTH_KEY_PREFIX}{provider.value}", "failures", 0)
#         logger.info("provider_cooldown_expired", extra={"provider": provider.value})
#         return True
#     return False


# async def get_provider_health() -> dict:
#     redis  = await get_redis()
#     result = {}
#     for provider in Provider:
#         key  = f"{_HEALTH_KEY_PREFIX}{provider.value}"
#         data = await redis.hgetall(key)
#         failures = int(data.get("failures", 0))
#         result[provider.value] = {
#             "available":            failures < _FAILURE_THRESHOLD,
#             "consecutive_failures": failures,
#             "avg_latency_ms":       float(data.get("avg_latency", 0)),
#         }
#     return result


# # ─────────────────────────────────────────────────────────────
# # SECTION 3: INDIVIDUAL PROVIDER CALLERS
# # FIX: All SDK imports moved inside the function body (lazy imports).
# # ─────────────────────────────────────────────────────────────

# async def _call_gemini(
#     system_prompt:    str,
#     history:          list[dict],
#     user_message:     str,
#     image_bytes:      Optional[bytes] = None,
#     override_api_key: Optional[str]   = None,
# ) -> str:
#     # FIX: Lazy import — only fails HERE if package missing, not at module load
#     import google.generativeai as genai

#     if override_api_key:
#         genai.configure(api_key=override_api_key)
#     # else: uses key configured globally at app startup in main.py

#     model = genai.GenerativeModel(
#         model_name="gemini-2.5-flash",
#         system_instruction=system_prompt,
#     )
#     chat = model.start_chat(history=history)

#     if image_bytes:
#         import PIL.Image, io
#         img      = PIL.Image.open(io.BytesIO(image_bytes))
#         response = await asyncio.to_thread(chat.send_message, [user_message, img])
#     else:
#         response = await asyncio.to_thread(chat.send_message, user_message)

#     return response.text


# async def _call_claude(
#     system_prompt:    str,
#     history:          list[dict],
#     user_message:     str,
#     image_bytes:      Optional[bytes] = None,
#     override_api_key: Optional[str]   = None,
# ) -> str:
#     # FIX: Lazy import
#     import anthropic as anthropic_sdk

#     api_key = override_api_key or settings.ANTHROPIC_API_KEY
#     client  = anthropic_sdk.AsyncAnthropic(api_key=api_key)

#     claude_msgs: list[dict] = []
#     for msg in history:
#         role    = "assistant" if msg["role"] == "model" else msg["role"]
#         content = msg["parts"][0] if "parts" in msg else msg.get("content", "")
#         claude_msgs.append({"role": role, "content": content})

#     claude_msgs.append({"role": "user", "content": user_message})

#     response = await client.messages.create(
#         model=_CONFIG_BY_NAME[Provider.CLAUDE].model,
#         max_tokens=1024,
#         system=system_prompt,
#         messages=claude_msgs,
#     )
#     return response.content[0].text


# async def _call_groq(
#     system_prompt:    str,
#     history:          list[dict],
#     user_message:     str,
#     image_bytes:      Optional[bytes] = None,
#     override_api_key: Optional[str]   = None,
# ) -> str:
#     # FIX: Lazy import
#     from groq import Groq

#     api_key = override_api_key or settings.GROQ_API_KEY
#     client  = Groq(api_key=api_key)

#     messages: list[dict] = [{"role": "system", "content": system_prompt}]
#     for msg in history:
#         role    = "assistant" if msg["role"] == "model" else msg["role"]
#         content = msg["parts"][0] if "parts" in msg else msg.get("content", "")
#         messages.append({"role": role, "content": content})
#     messages.append({"role": "user", "content": user_message})

#     def _sync() -> str:
#         resp = client.chat.completions.create(
#             model=_CONFIG_BY_NAME[Provider.GROQ].model,
#             messages=messages,
#             max_tokens=1024,
#         )
#         return resp.choices[0].message.content

#     return await asyncio.to_thread(_sync)


# _CALLERS = {
#     Provider.GEMINI: _call_gemini,
#     Provider.CLAUDE: _call_claude,
#     Provider.GROQ:   _call_groq,
# }


# # ─────────────────────────────────────────────────────────────
# # SECTION 4: RESPONSE MODEL
# # ─────────────────────────────────────────────────────────────

# @dataclass
# class AIRouterResponse:
#     text:          str
#     provider_used: Provider
#     latency_ms:    float
#     fallback_used: bool
#     attempt_count: int


# # ─────────────────────────────────────────────────────────────
# # SECTION 5: MAIN FAILOVER ENGINE
# # ─────────────────────────────────────────────────────────────

# async def route_request(
#     system_prompt:    str,
#     history:          list[dict],
#     user_message:     str,
#     image_bytes:      Optional[bytes] = None,
#     require_vision:   bool            = False,
#     override_api_key: Optional[str]   = None,
#     cost_priority:    bool            = False,
# ) -> AIRouterResponse:
#     candidates = [c for c in PROVIDER_CONFIGS
#                   if not require_vision or c.supports_vision]

#     if not candidates:
#         raise RuntimeError("No providers support vision. Check provider configuration.")

#     if cost_priority:
#         candidates = sorted(candidates, key=lambda c: c.cost_per_1k)
#     else:
#         candidates = sorted(candidates, key=lambda c: c.priority)

#     errors:  list[str] = []
#     attempt: int       = 0

#     for config in candidates:
#         if not await _is_available(config.name):
#             logger.info(f"provider_skipped_cooldown: {config.name.value}")
#             continue

#         caller  = _CALLERS[config.name]
#         attempt += 1
#         start   = time.perf_counter()

#         try:
#             logger.info(f"provider_attempt: {config.name.value} attempt={attempt}")

#             text = await asyncio.wait_for(
#                 caller(
#                     system_prompt    = system_prompt,
#                     history          = history,
#                     user_message     = user_message,
#                     image_bytes      = image_bytes,
#                     override_api_key = override_api_key,
#                 ),
#                 timeout=config.timeout_sec,
#             )

#             latency_ms = (time.perf_counter() - start) * 1000
#             await _record_success(config.name, latency_ms)

#             logger.info(
#                 f"provider_success: {config.name.value} "
#                 f"latency_ms={round(latency_ms)} fallback={attempt > 1}"
#             )

#             return AIRouterResponse(
#                 text          = text,
#                 provider_used = config.name,
#                 latency_ms    = latency_ms,
#                 fallback_used = attempt > 1,
#                 attempt_count = attempt,
#             )

#         except asyncio.TimeoutError:
#             await _record_failure(config.name)
#             err = f"{config.name.value}: timeout after {config.timeout_sec}s"
#             errors.append(err)
#             logger.warning(f"provider_timeout: {config.name.value}")

#         except Exception as e:
#             await _record_failure(config.name)
#             err = f"{config.name.value}: {type(e).__name__} — {str(e)[:120]}"
#             errors.append(err)
#             logger.error(f"provider_error: {config.name.value} error={str(e)[:200]}")

#     raise RuntimeError(
#         f"All {attempt} AI providers failed.\n" + "\n".join(errors)
#     )


# # ─────────────────────────────────────────────────────────────
# # SECTION 6: PUBLIC CONVENIENCE WRAPPERS
# # ─────────────────────────────────────────────────────────────

# async def socratic_chat(
#     system_prompt:    str,
#     history:          list[dict],
#     user_message:     str,
#     override_api_key: Optional[str] = None,
# ) -> AIRouterResponse:
#     return await route_request(
#         system_prompt    = system_prompt,
#         history          = history,
#         user_message     = user_message,
#         override_api_key = override_api_key,
#     )


# async def vision_audit(
#     system_prompt:    str,
#     user_message:     str,
#     image_bytes:      bytes,
#     override_api_key: Optional[str] = None,
# ) -> AIRouterResponse:
#     return await route_request(
#         system_prompt    = system_prompt,
#         history          = [],
#         user_message     = user_message,
#         image_bytes      = image_bytes,
#         require_vision   = True,
#         override_api_key = override_api_key,
#     )


# async def generate_hint(
#     system_prompt:    str,
#     hint_prompt:      str,
#     override_api_key: Optional[str] = None,
# ) -> AIRouterResponse:
#     return await route_request(
#         system_prompt    = system_prompt,
#         history          = [],
#         user_message     = hint_prompt,
#         cost_priority    = True,
#         override_api_key = override_api_key,
#     )



# ==============================================================
# FILE: ishaa_v2/services/ai_router.py
# ==============================================================

import asyncio
import time
import logging
from typing import Optional
from dataclasses import dataclass
from enum import Enum

# FIX: Removed top-level SDK imports of google.generativeai, anthropic, and groq.
# Previously these were imported at module level:
#
#   import google.generativeai as genai   ← crashes if package not installed
#   import anthropic                       ← crashes if package not installed
#   from groq import Groq                  ← crashes if package not installed
#
# If ANY of these packages is missing or has an import error, the entire
# ai_router.py module fails to import. This cascades:
#   ai_router.py FAIL → ai_service.py FAIL → ai_help.py FAIL → router never registered
# Result: all /ai-help/* routes return 404 while /auth/* works fine.
#
# FIX: Imports are now LAZY — done inside each caller function just before use.
# The module always loads successfully. Only the specific provider fails at
# call time (with a clean error) if its SDK isn't installed.

from config import settings
from database import get_redis

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# SECTION 1: PROVIDER CONFIGURATION
# ─────────────────────────────────────────────────────────────

class Provider(str, Enum):
    GEMINI = "gemini"
    CLAUDE = "claude"
    GROQ   = "groq"


@dataclass(frozen=True)
class ProviderConfig:
    name:            Provider
    model:           str
    cost_per_1k:     float
    timeout_sec:     int
    supports_vision: bool
    priority:        int


PROVIDER_CONFIGS: list[ProviderConfig] = [
    ProviderConfig(
        name=Provider.GEMINI, model="gemini-2.5-flash",
        cost_per_1k=0.00035, timeout_sec=15,
        supports_vision=True, priority=1,
    ),
    ProviderConfig(
        name=Provider.CLAUDE, model="claude-haiku-4-5-20251001",
        cost_per_1k=0.00080, timeout_sec=20,
        supports_vision=False, priority=2,
    ),
    ProviderConfig(
        name=Provider.GROQ, model="llama-3.3-70b-versatile",
        cost_per_1k=0.00008, timeout_sec=10,
        supports_vision=False, priority=3,
    ),
]

_CONFIG_BY_NAME: dict[Provider, ProviderConfig] = {c.name: c for c in PROVIDER_CONFIGS}


# ─────────────────────────────────────────────────────────────
# SECTION 2: REDIS-BACKED HEALTH REGISTRY
# ─────────────────────────────────────────────────────────────

_HEALTH_KEY_PREFIX = "ph:"
_FAILURE_THRESHOLD = 3
_COOLDOWN_SECONDS  = 60


async def _get_failures(provider: Provider) -> tuple[int, float]:
    redis = await get_redis()
    key   = f"{_HEALTH_KEY_PREFIX}{provider.value}"
    data  = await redis.hgetall(key)
    return int(data.get("failures", 0)), float(data.get("last_fail", 0.0))


async def _record_success(provider: Provider, latency_ms: float) -> None:
    redis   = await get_redis()
    key     = f"{_HEALTH_KEY_PREFIX}{provider.value}"
    current = await redis.hget(key, "avg_latency") or "0"
    new_avg = float(current) * 0.8 + latency_ms * 0.2
    await redis.hset(key, mapping={"failures": 0, "avg_latency": round(new_avg, 1)})


async def _record_failure(provider: Provider) -> None:
    redis = await get_redis()
    key   = f"{_HEALTH_KEY_PREFIX}{provider.value}"
    async with redis.pipeline(transaction=True) as pipe:
        pipe.hincrby(key, "failures", 1)
        pipe.hset(key, "last_fail", time.monotonic())
        pipe.expire(key, 300)
        await pipe.execute()


async def _is_available(provider: Provider) -> bool:
    failures, last_fail = await _get_failures(provider)
    if failures < _FAILURE_THRESHOLD:
        return True
    elapsed = time.monotonic() - last_fail
    if elapsed >= _COOLDOWN_SECONDS:
        redis = await get_redis()
        await redis.hset(f"{_HEALTH_KEY_PREFIX}{provider.value}", "failures", 0)
        logger.info("provider_cooldown_expired", extra={"provider": provider.value})
        return True
    return False


async def get_provider_health() -> dict:
    redis  = await get_redis()
    result = {}
    for provider in Provider:
        key  = f"{_HEALTH_KEY_PREFIX}{provider.value}"
        data = await redis.hgetall(key)
        failures = int(data.get("failures", 0))
        result[provider.value] = {
            "available":            failures < _FAILURE_THRESHOLD,
            "consecutive_failures": failures,
            "avg_latency_ms":       float(data.get("avg_latency", 0)),
        }
    return result


# ─────────────────────────────────────────────────────────────
# SECTION 3: INDIVIDUAL PROVIDER CALLERS
# FIX: All SDK imports moved inside the function body (lazy imports).
# ─────────────────────────────────────────────────────────────

async def _call_gemini(
    system_prompt:    str,
    history:          list[dict],
    user_message:     str,
    image_bytes:      Optional[bytes] = None,
    override_api_key: Optional[str]   = None,
) -> str:
    # FIX: Lazy import — only fails HERE if package missing, not at module load
    import google.generativeai as genai

    if override_api_key:
        genai.configure(api_key=override_api_key)
    # else: uses key configured globally at app startup in main.py

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=system_prompt,
    )
    chat = model.start_chat(history=history)

    if image_bytes:
        import PIL.Image, io
        img      = PIL.Image.open(io.BytesIO(image_bytes))
        response = await asyncio.to_thread(chat.send_message, [user_message, img])
    else:
        response = await asyncio.to_thread(chat.send_message, user_message)

    return response.text


async def _call_claude(
    system_prompt:    str,
    history:          list[dict],
    user_message:     str,
    image_bytes:      Optional[bytes] = None,
    override_api_key: Optional[str]   = None,
) -> str:
    # FIX: Lazy import
    import anthropic as anthropic_sdk

    api_key = override_api_key or settings.ANTHROPIC_API_KEY
    client  = anthropic_sdk.AsyncAnthropic(api_key=api_key)

    claude_msgs: list[dict] = []
    for msg in history:
        role    = "assistant" if msg["role"] == "model" else msg["role"]
        content = msg["parts"][0] if "parts" in msg else msg.get("content", "")
        claude_msgs.append({"role": role, "content": content})

    claude_msgs.append({"role": "user", "content": user_message})

    response = await client.messages.create(
        model=_CONFIG_BY_NAME[Provider.CLAUDE].model,
        max_tokens=1024,
        system=system_prompt,
        messages=claude_msgs,
    )
    return response.content[0].text


async def _call_groq(
    system_prompt:    str,
    history:          list[dict],
    user_message:     str,
    image_bytes:      Optional[bytes] = None,
    override_api_key: Optional[str]   = None,
) -> str:
    # FIX: Lazy import
    from groq import Groq

    api_key = override_api_key or settings.GROQ_API_KEY
    client  = Groq(api_key=api_key)

    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for msg in history:
        role    = "assistant" if msg["role"] == "model" else msg["role"]
        content = msg["parts"][0] if "parts" in msg else msg.get("content", "")
        messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_message})

    def _sync() -> str:
        resp = client.chat.completions.create(
            model=_CONFIG_BY_NAME[Provider.GROQ].model,
            messages=messages,
            max_tokens=1024,
        )
        return resp.choices[0].message.content

    return await asyncio.to_thread(_sync)


_CALLERS = {
    Provider.GEMINI: _call_gemini,
    Provider.CLAUDE: _call_claude,
    Provider.GROQ:   _call_groq,
}


def _provider_has_server_key(provider: Provider) -> bool:
    if provider == Provider.GEMINI:
        return bool(settings.GOOGLE_API_KEY)
    if provider == Provider.CLAUDE:
        return bool(settings.ANTHROPIC_API_KEY)
    if provider == Provider.GROQ:
        return bool(settings.GROQ_API_KEY)
    return False


# ─────────────────────────────────────────────────────────────
# SECTION 4: RESPONSE MODEL
# ─────────────────────────────────────────────────────────────

@dataclass
class AIRouterResponse:
    text:          str
    provider_used: Provider
    latency_ms:    float
    fallback_used: bool
    attempt_count: int


# ─────────────────────────────────────────────────────────────
# SECTION 5: MAIN FAILOVER ENGINE
# ─────────────────────────────────────────────────────────────

async def route_request(
    system_prompt:    str,
    history:          list[dict],
    user_message:     str,
    image_bytes:      Optional[bytes] = None,
    require_vision:   bool            = False,
    override_api_key: Optional[str]   = None,
    cost_priority:    bool            = False,
) -> AIRouterResponse:
    # BYOK mode currently supports Gemini keys only, so keep routing deterministic.
    if override_api_key:
        candidates = [_CONFIG_BY_NAME[Provider.GEMINI]]
    else:
        candidates = [c for c in PROVIDER_CONFIGS if _provider_has_server_key(c.name)]

    if require_vision:
        candidates = [c for c in candidates if c.supports_vision]

    if not candidates:
        raise RuntimeError("No available AI providers. Check API keys and provider configuration.")

    if cost_priority:
        candidates = sorted(candidates, key=lambda c: c.cost_per_1k)
    else:
        candidates = sorted(candidates, key=lambda c: c.priority)

    errors:  list[str] = []
    attempt: int       = 0

    for config in candidates:
        if not await _is_available(config.name):
            logger.info(f"provider_skipped_cooldown: {config.name.value}")
            continue

        caller  = _CALLERS[config.name]
        attempt += 1
        start   = time.perf_counter()

        try:
            logger.info(f"provider_attempt: {config.name.value} attempt={attempt}")

            text = await asyncio.wait_for(
                caller(
                    system_prompt    = system_prompt,
                    history          = history,
                    user_message     = user_message,
                    image_bytes      = image_bytes,
                    override_api_key = override_api_key,
                ),
                timeout=config.timeout_sec,
            )

            latency_ms = (time.perf_counter() - start) * 1000
            await _record_success(config.name, latency_ms)

            logger.info(
                f"provider_success: {config.name.value} "
                f"latency_ms={round(latency_ms)} fallback={attempt > 1}"
            )

            return AIRouterResponse(
                text          = text,
                provider_used = config.name,
                latency_ms    = latency_ms,
                fallback_used = attempt > 1,
                attempt_count = attempt,
            )

        except asyncio.TimeoutError:
            await _record_failure(config.name)
            err = f"{config.name.value}: timeout after {config.timeout_sec}s"
            errors.append(err)
            logger.warning(f"provider_timeout: {config.name.value}")

        except Exception as e:
            await _record_failure(config.name)
            err = f"{config.name.value}: {type(e).__name__} — {str(e)[:120]}"
            errors.append(err)
            logger.error(f"provider_error: {config.name.value} error={str(e)[:200]}")

    raise RuntimeError(
        f"All {attempt} AI providers failed.\n" + "\n".join(errors)
    )


# ─────────────────────────────────────────────────────────────
# SECTION 6: PUBLIC CONVENIENCE WRAPPERS
# ─────────────────────────────────────────────────────────────

async def socratic_chat(
    system_prompt:    str,
    history:          list[dict],
    user_message:     str,
    override_api_key: Optional[str] = None,
) -> AIRouterResponse:
    return await route_request(
        system_prompt    = system_prompt,
        history          = history,
        user_message     = user_message,
        override_api_key = override_api_key,
    )


async def vision_audit(
    system_prompt:    str,
    user_message:     str,
    image_bytes:      bytes,
    override_api_key: Optional[str] = None,
) -> AIRouterResponse:
    return await route_request(
        system_prompt    = system_prompt,
        history          = [],
        user_message     = user_message,
        image_bytes      = image_bytes,
        require_vision   = True,
        override_api_key = override_api_key,
    )


async def generate_hint(
    system_prompt:    str,
    hint_prompt:      str,
    override_api_key: Optional[str] = None,
) -> AIRouterResponse:
    return await route_request(
        system_prompt    = system_prompt,
        history          = [],
        user_message     = hint_prompt,
        cost_priority    = True,
        override_api_key = override_api_key,
    )