# # # ==============================================================
# # # FILE: backend/database.py
# # # ==============================================================

# # import logging
# # from typing import Optional

# # from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
# # from redis.asyncio import Redis, ConnectionPool
# # from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT

# # from config import settings

# # logger = logging.getLogger(__name__)

# # # ─────────────────────────────────────────────────────────────
# # # SECTION 1: MONGODB CLIENT
# # # ─────────────────────────────────────────────────────────────

# # _mongo_client: Optional[AsyncIOMotorClient] = None
# # _db:           Optional[AsyncIOMotorDatabase] = None


# # def _get_mongo_client() -> AsyncIOMotorClient:
# #     global _mongo_client
# #     if _mongo_client is None:
# #         _mongo_client = AsyncIOMotorClient(
# #             settings.MONGODB_URI,
# #             maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
# #             minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
# #             serverSelectionTimeoutMS=5000,
# #             connectTimeoutMS=3000,
# #             socketTimeoutMS=20000,
# #             retryWrites=True,
# #             retryReads=True,
# #         )
# #     return _mongo_client


# # def _get_db() -> AsyncIOMotorDatabase:
# #     global _db
# #     if _db is None:
# #         _db = _get_mongo_client()[settings.MONGODB_DB_NAME]
# #     return _db


# # # FIX: Removed broken @property decorators — @property only works on class methods,
# # # not module-level functions. Those became unusable property objects.
# # # Collections are accessed directly via _get_db()["collection_name"] throughout
# # # the codebase, so these shortcuts were unused anyway. Keeping as plain functions
# # # for any future callers that need them.

# # def get_collection(name: str):
# #     """Generic collection accessor."""
# #     return _get_db()[name]


# # # ─────────────────────────────────────────────────────────────
# # # SECTION 2: REDIS CLIENT
# # # ─────────────────────────────────────────────────────────────

# # _redis_pool: Optional[ConnectionPool] = None


# # def _get_redis_pool() -> ConnectionPool:
# #     global _redis_pool
# #     if _redis_pool is None:
# #         _redis_pool = ConnectionPool.from_url(
# #             settings.REDIS_URL,
# #             max_connections=settings.REDIS_MAX_CONNECTIONS,
# #             decode_responses=True,
# #             socket_timeout=2.0,
# #             socket_connect_timeout=2.0,
# #         )
# #     return _redis_pool


# # async def get_redis() -> Redis:
# #     """
# #     Returns an async Redis client borrowing from the connection pool.
    
# #     Usage:
# #         redis = await get_redis()
# #         count = await redis.incr("my_counter")
# #     """
# #     return Redis(connection_pool=_get_redis_pool())


# # # ─────────────────────────────────────────────────────────────
# # # SECTION 3: LIFECYCLE HOOKS
# # # ─────────────────────────────────────────────────────────────

# # async def startup_db() -> None:
# #     """
# #     Called once when the FastAPI app starts.
# #     Tests MongoDB + Redis connectivity and ensures indexes exist.
# #     """
# #     logger.info("Connecting to MongoDB...")
# #     try:
# #         await _get_mongo_client().admin.command("ping")
# #         logger.info("✅ MongoDB connected")
# #     except Exception as e:
# #         logger.critical(f"❌ MongoDB connection failed: {e}")
# #         raise

# #     await _ensure_indexes()

# #     logger.info("Connecting to Redis...")
# #     try:
# #         redis = await get_redis()
# #         await redis.ping()
# #         logger.info("✅ Redis connected")
# #     except Exception as e:
# #         if settings.is_production:
# #             logger.critical(f"❌ Redis connection failed in production: {e}")
# #             raise
# #         else:
# #             logger.warning(f"⚠️  Redis unavailable (non-fatal in dev): {e}")


# # async def shutdown_db() -> None:
# #     """
# #     Called when the FastAPI app shuts down.
# #     Cleanly closes MongoDB and Redis connections.
# #     """
# #     global _mongo_client, _redis_pool

# #     if _mongo_client:
# #         _mongo_client.close()
# #         _mongo_client = None
# #         logger.info("MongoDB connection closed")

# #     if _redis_pool:
# #         await _redis_pool.disconnect()
# #         _redis_pool = None
# #         logger.info("Redis connection closed")


# # async def _ensure_indexes() -> None:
# #     """Creates all required MongoDB indexes if they don't already exist."""
# #     db = _get_db()
# #     logger.info("Ensuring database indexes...")

# #     await db["questions"].create_indexes([
# #         IndexModel([("topic_id", ASCENDING)]),
# #         IndexModel([("subject.name", ASCENDING), ("difficulty", ASCENDING)]),
# #         IndexModel([("chapter.name", ASCENDING), ("topic.name", ASCENDING)]),
# #         IndexModel([("formulas_used.name", ASCENDING)]),
# #         IndexModel([("text", TEXT)]),
# #     ])

# #     await db["User_Smart_Profile"].create_indexes([
# #         IndexModel([("profile.email", ASCENDING)], unique=True),
# #         IndexModel([("subscription.plan", ASCENDING)]),
# #         IndexModel([("gamification.total_xp", DESCENDING)]),
# #     ])

# #     await db["Global_User_Activity"].create_indexes([
# #         IndexModel([("user_id", ASCENDING), ("timestamp", DESCENDING)]),
# #         IndexModel([("question_id", ASCENDING), ("is_correct", ASCENDING)]),
# #     ])

# #     await db["User_Progress_Cache"].create_indexes([
# #         IndexModel([("user_id", ASCENDING), ("entity_id", ASCENDING)], unique=True),
# #     ])

# #     logger.info("✅ All indexes verified")









# # ==============================================================
# # FILE: ishaa_v2/database.py
# # ==============================================================

# import logging
# from typing import Optional

# from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
# from redis.asyncio import Redis, ConnectionPool
# from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT

# from config import settings

# logger = logging.getLogger(__name__)

# # ─────────────────────────────────────────────────────────────
# # SECTION 1: MONGODB CLIENT
# # ─────────────────────────────────────────────────────────────

# _mongo_client: Optional[AsyncIOMotorClient] = None
# _db:           Optional[AsyncIOMotorDatabase] = None


# def _get_mongo_client() -> AsyncIOMotorClient:
#     global _mongo_client
#     if _mongo_client is None:
#         _mongo_client = AsyncIOMotorClient(
#             settings.MONGODB_URI,
#             maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
#             minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
#             serverSelectionTimeoutMS=5000,
#             connectTimeoutMS=3000,
#             socketTimeoutMS=20000,
#             retryWrites=True,
#             retryReads=True,
#         )
#     return _mongo_client


# def get_db() -> AsyncIOMotorDatabase:
#     """
#     Public accessor for the active MongoDB database instance.
#     (Exposed as get_db to support standard FastAPI dependency injection patterns).
#     """
#     global _db
#     if _db is None:
#         _db = _get_mongo_client()[settings.MONGODB_DB_NAME]
#     return _db


# # Maintain internal alias for backward compatibility with older services
# _get_db = get_db


# def get_collection(name: str):
#     """Generic collection accessor."""
#     return get_db()[name]


# # ─────────────────────────────────────────────────────────────
# # SECTION 2: REDIS CLIENT
# # ─────────────────────────────────────────────────────────────

# _redis_pool: Optional[ConnectionPool] = None


# def _get_redis_pool() -> ConnectionPool:
#     global _redis_pool
#     if _redis_pool is None:
#         _redis_pool = ConnectionPool.from_url(
#             settings.REDIS_URL,
#             max_connections=settings.REDIS_MAX_CONNECTIONS,
#             decode_responses=True,
#             socket_timeout=2.0,
#             socket_connect_timeout=2.0,
#         )
#     return _redis_pool


# async def get_redis() -> Redis:
#     """
#     Returns an async Redis client borrowing from the connection pool.
    
#     Usage:
#         redis = await get_redis()
#         count = await redis.incr("my_counter")
#     """
#     return Redis(connection_pool=_get_redis_pool())


# # ─────────────────────────────────────────────────────────────
# # SECTION 3: LIFECYCLE HOOKS
# # ─────────────────────────────────────────────────────────────

# async def startup_db() -> None:
#     """
#     Called once when the FastAPI app starts.
#     Tests MongoDB + Redis connectivity and ensures indexes exist.
#     """
#     logger.info("Connecting to MongoDB...")
#     try:
#         await _get_mongo_client().admin.command("ping")
#         logger.info("✅ MongoDB connected")
#     except Exception as e:
#         logger.critical(f"❌ MongoDB connection failed: {e}")
#         raise

#     await _ensure_indexes()

#     logger.info("Connecting to Redis...")
#     try:
#         redis = await get_redis()
#         await redis.ping()
#         logger.info("✅ Redis connected")
#     except Exception as e:
#         if settings.is_production:
#             logger.critical(f"❌ Redis connection failed in production: {e}")
#             raise
#         else:
#             logger.warning(f"⚠️  Redis unavailable (non-fatal in dev): {e}")


# async def shutdown_db() -> None:
#     """
#     Called when the FastAPI app shuts down.
#     Cleanly closes MongoDB and Redis connections.
#     """
#     global _mongo_client, _redis_pool

#     if _mongo_client:
#         _mongo_client.close()
#         _mongo_client = None
#         logger.info("MongoDB connection closed")

#     if _redis_pool:
#         await _redis_pool.disconnect()
#         _redis_pool = None
#         logger.info("Redis connection closed")


# async def _ensure_indexes() -> None:
#     """Creates all required MongoDB indexes if they don't already exist."""
#     db = get_db()
#     logger.info("Ensuring database indexes...")

#     await db["questions"].create_indexes([
#         IndexModel([("topic_id", ASCENDING)]),
#         IndexModel([("subject.name", ASCENDING), ("difficulty", ASCENDING)]),
#         IndexModel([("chapter.name", ASCENDING), ("topic.name", ASCENDING)]),
#         IndexModel([("formulas_used.name", ASCENDING)]),
#         IndexModel([("text", TEXT)]),
#     ])

#     await db["User_Smart_Profile"].create_indexes([
#         IndexModel([("profile.email", ASCENDING)], unique=True),
#         IndexModel([("subscription.plan", ASCENDING)]),
#         IndexModel([("gamification.total_xp", DESCENDING)]),
#     ])

#     await db["Global_User_Activity"].create_indexes([
#         IndexModel([("user_id", ASCENDING), ("timestamp", DESCENDING)]),
#         IndexModel([("question_id", ASCENDING), ("is_correct", ASCENDING)]),
#     ])

#     await db["User_Progress_Cache"].create_indexes([
#         IndexModel([("user_id", ASCENDING), ("entity_id", ASCENDING)], unique=True),
#     ])

#     await db["AI_Chat_History"].create_indexes([
#         IndexModel([("user_id", ASCENDING), ("question_id", ASCENDING)], unique=True),
#         IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0),
#         IndexModel([("updated_at", DESCENDING)]),
#     ])

#     logger.info("✅ All indexes verified")




# ==============================================================
# FILE: ishaa_v2/database.py
# ==============================================================

import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from redis.asyncio import Redis, ConnectionPool
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT

from config import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# SECTION 1: MONGODB CLIENT
# ─────────────────────────────────────────────────────────────

_mongo_client: Optional[AsyncIOMotorClient] = None
_db:           Optional[AsyncIOMotorDatabase] = None


def _get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
            minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=3000,
            socketTimeoutMS=20000,
            retryWrites=True,
            retryReads=True,
        )
    return _mongo_client


def get_db() -> AsyncIOMotorDatabase:
    """
    Public accessor for the active MongoDB database instance.
    (Exposed as get_db to support standard FastAPI dependency injection patterns).
    """
    global _db
    if _db is None:
        # 🚀 THE FIX: Hardcoding the database name to "test" to match Node.js
        _db = _get_mongo_client()["test"]
    return _db


# Maintain internal alias for backward compatibility with older services
_get_db = get_db


def get_collection(name: str):
    """Generic collection accessor."""
    return get_db()[name]


# ─────────────────────────────────────────────────────────────
# SECTION 2: REDIS CLIENT
# ─────────────────────────────────────────────────────────────

_redis_pool: Optional[ConnectionPool] = None


def _get_redis_pool() -> ConnectionPool:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            decode_responses=True,
            socket_timeout=2.0,
            socket_connect_timeout=2.0,
        )
    return _redis_pool


async def get_redis() -> Redis:
    """
    Returns an async Redis client borrowing from the connection pool.
    
    Usage:
        redis = await get_redis()
        count = await redis.incr("my_counter")
    """
    return Redis(connection_pool=_get_redis_pool())


# ─────────────────────────────────────────────────────────────
# SECTION 3: LIFECYCLE HOOKS
# ─────────────────────────────────────────────────────────────

async def startup_db() -> None:
    """
    Called once when the FastAPI app starts.
    Tests MongoDB + Redis connectivity and ensures indexes exist.
    """
    logger.info("Connecting to MongoDB...")
    try:
        await _get_mongo_client().admin.command("ping")
        logger.info("✅ MongoDB connected")
    except Exception as e:
        logger.critical(f"❌ MongoDB connection failed: {e}")
        raise

    await _ensure_indexes()

    logger.info("Connecting to Redis...")
    try:
        redis = await get_redis()
        await redis.ping()
        logger.info("✅ Redis connected")
    except Exception as e:
        if settings.is_production:
            logger.critical(f"❌ Redis connection failed in production: {e}")
            raise
        else:
            logger.warning(f"⚠️  Redis unavailable (non-fatal in dev): {e}")


async def shutdown_db() -> None:
    """
    Called when the FastAPI app shuts down.
    Cleanly closes MongoDB and Redis connections.
    """
    global _mongo_client, _redis_pool

    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
        logger.info("MongoDB connection closed")

    if _redis_pool:
        await _redis_pool.disconnect()
        _redis_pool = None
        logger.info("Redis connection closed")


async def _ensure_indexes() -> None:
    """Creates all required MongoDB indexes if they don't already exist."""
    db = get_db()
    logger.info("Ensuring database indexes...")

    await db["questions"].create_indexes([
        IndexModel([("topic_id", ASCENDING)]),
        IndexModel([("subject.name", ASCENDING), ("difficulty", ASCENDING)]),
        IndexModel([("chapter.name", ASCENDING), ("topic.name", ASCENDING)]),
        IndexModel([("formulas_used.name", ASCENDING)]),
        IndexModel([("text", TEXT)]),
    ])

    await db["User_Smart_Profile"].create_indexes([
        IndexModel([("profile.email", ASCENDING)], unique=True),
        IndexModel([("subscription.plan", ASCENDING)]),
        IndexModel([("gamification.total_xp", DESCENDING)]),
    ])

    await db["Global_User_Activity"].create_indexes([
        IndexModel([("user_id", ASCENDING), ("timestamp", DESCENDING)]),
        IndexModel([("question_id", ASCENDING), ("is_correct", ASCENDING)]),
    ])

    await db["User_Progress_Cache"].create_indexes([
        IndexModel([("user_id", ASCENDING), ("entity_id", ASCENDING)], unique=True),
    ])

    await db["AI_Chat_History"].create_indexes([
        IndexModel([("user_id", ASCENDING), ("question_id", ASCENDING)], unique=True),
        IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0),
        IndexModel([("updated_at", DESCENDING)]),
    ])

    logger.info("✅ All indexes verified")