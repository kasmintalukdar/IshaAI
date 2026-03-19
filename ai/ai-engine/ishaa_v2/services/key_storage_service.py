# # ==============================================================
# # FILE: backend/services/key_storage_service.py
# #
# # PURPOSE:
# #   Handles secure storage and retrieval of each free-plan student's
# #   personal AI API key (e.g., their own Google Gemini key from
# #   aistudio.google.com).
# #
# # SECURITY DESIGN:
# #   ┌──────────────────────────────────────────────────────────┐
# #   │  Student pastes key  →  Encrypt (AES-256/Fernet)         │
# #   │  → Store ciphertext in MongoDB                           │
# #   │  → At request time: decrypt in memory → use → discard   │
# #   └──────────────────────────────────────────────────────────┘
# #
# #   Even if MongoDB is fully compromised, attackers cannot recover
# #   the plain-text keys without the KEY_ENCRYPTION_SECRET from .env.
# #
# #   Fernet (used here) provides:
# #     - AES-128-CBC encryption
# #     - PKCS7 padding
# #     - HMAC-SHA256 authentication (detects tampering)
# #     - Timestamp (optional, not enforced here)
# #
# # PERFORMANCE:
# #   Encryption/decryption is pure CPU (microsecond range).
# #   The only I/O cost is the MongoDB read/write, which is async.
# #   The Fernet object is created ONCE at module load (not per request).
# #
# # MONGODB FIELD:
# #   User document: user.free_tier.encrypted_api_key (string)
# #   We project only this field when reading — no full document fetch.
# # ==============================================================

# import logging
# from typing import Optional
# from datetime import datetime, timezone

# from cryptography.fernet import Fernet, InvalidToken
# from motor.motor_asyncio import AsyncIOMotorCollection

# from config import settings

# logger = logging.getLogger(__name__)


# # ─────────────────────────────────────────────────────────────
# # SECTION 1: ENCRYPTOR SINGLETON
# #
# # The Fernet instance is created once at module import.
# # This avoids re-parsing the key on every encrypt/decrypt call.
# # If KEY_ENCRYPTION_SECRET is invalid, app crashes at startup —
# # which is the correct behavior (fail-fast security principle).
# # ─────────────────────────────────────────────────────────────

# class _KeyEncryptor:
#     """
#     AES-256 symmetric encryption wrapper using Fernet.
#     Instantiated once as a module-level singleton.
#     """

#     __slots__ = ("_fernet",)   # Memory optimization — no __dict__ overhead

#     def __init__(self, secret: str) -> None:
#         """
#         Args:
#             secret: URL-safe base64-encoded 32-byte key from .env.
#                     Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
        
#         Raises:
#             ValueError: If secret is not a valid Fernet key.
#             EnvironmentError: If secret is missing.
#         """
#         if not secret:
#             raise EnvironmentError(
#                 "KEY_ENCRYPTION_SECRET is not set. "
#                 "Generate with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
#             )
#         self._fernet = Fernet(secret.encode())

#     def encrypt(self, plaintext: str) -> str:
#         """
#         Encrypts a plain-text API key string.
        
#         Args:
#             plaintext: Raw API key, e.g. "AIzaSy..."
        
#         Returns:
#             URL-safe base64-encoded ciphertext string, safe for MongoDB storage.
#         """
#         return self._fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")

#     def decrypt(self, ciphertext: str) -> str:
#         """
#         Decrypts a stored ciphertext back to the plain-text API key.
#         Call this immediately before use; never log or persist the result.
        
#         Args:
#             ciphertext: The encrypted string stored in MongoDB.
        
#         Returns:
#             The original plain-text API key.
        
#         Raises:
#             ValueError: If the token is corrupted, tampered, or encrypted
#                         with a different secret key.
#         """
#         try:
#             return self._fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
#         except InvalidToken as e:
#             raise ValueError(
#                 "Decryption failed — token invalid, corrupted, or wrong secret key."
#             ) from e


# # Module-level singleton — initialized once
# _encryptor = _KeyEncryptor(settings.KEY_ENCRYPTION_SECRET)


# # ─────────────────────────────────────────────────────────────
# # SECTION 2: MONGODB OPERATIONS
# #
# # All operations use field projections to fetch only the fields
# # needed — never load the full 2KB+ user document for a key lookup.
# # ─────────────────────────────────────────────────────────────

# # MongoDB projection for key operations — fetch only free_tier field
# _KEY_PROJECTION = {"free_tier": 1, "_id": 0}


# async def save_user_api_key(
#     users_col:   AsyncIOMotorCollection,
#     user_id:     str,
#     raw_api_key: str,
#     provider:    str = "gemini",
# ) -> bool:
#     """
#     Encrypts and saves a student's personal API key to their MongoDB profile.
#     Called when the student submits their key in the Settings page.
    
#     Uses $set so it overwrites any previously stored key safely.
    
#     Args:
#         users_col:   Motor collection for User_Smart_Profile.
#         user_id:     Student's _id (string).
#         raw_api_key: Plain-text API key as entered by the student.
#         provider:    "gemini" | "groq" | "anthropic"
    
#     Returns:
#         True if saved successfully, False if user not found.
#     """
#     encrypted = _encryptor.encrypt(raw_api_key)  # Encrypt BEFORE any DB call

#     result = await users_col.update_one(
#         {"_id": user_id},
#         {
#             "$set": {
#                 "free_tier.encrypted_api_key": encrypted,
#                 "free_tier.api_key_provider":  provider,
#                 "free_tier.key_added_at":       datetime.now(timezone.utc),
#                 "free_tier.key_is_valid":       True,
#             }
#         }
#     )

#     if result.modified_count == 0:
#         logger.warning("save_user_api_key: no document updated", user_id=user_id)
#         return False

#     logger.info("API key saved", user_id=user_id, provider=provider)
#     return True


# async def get_user_api_key(
#     users_col: AsyncIOMotorCollection,
#     user_id:   str,
# ) -> Optional[str]:
#     """
#     Retrieves and decrypts a student's API key from MongoDB.
#     Called right before making an AI API call for free-plan students.
    
#     SECURITY: The decrypted key must be used immediately and never
#     stored, logged, cached in Redis, or added to any response body.
    
#     Args:
#         users_col: Motor collection.
#         user_id:   Student's _id.
    
#     Returns:
#         Decrypted plain-text API key, or None if not set / decryption fails.
#     """
#     # Project only the free_tier field — minimal data transfer
#     doc = await users_col.find_one({"_id": user_id}, _KEY_PROJECTION)

#     if not doc:
#         return None

#     free_tier = doc.get("free_tier", {})
#     ciphertext = free_tier.get("encrypted_api_key")

#     if not ciphertext:
#         return None

#     # Check if key was previously marked invalid (saves an API roundtrip)
#     if not free_tier.get("key_is_valid", True):
#         logger.info("get_user_api_key: key marked invalid", user_id=user_id)
#         return None

#     try:
#         return _encryptor.decrypt(ciphertext)
#     except ValueError:
#         logger.error("get_user_api_key: decryption failed", user_id=user_id)
#         return None


# async def mark_key_invalid(
#     users_col: AsyncIOMotorCollection,
#     user_id:   str,
# ) -> None:
#     """
#     Marks a student's stored API key as invalid.
    
#     Called when an AI API call fails with HTTP 401/403 — meaning the
#     student's key is revoked, quota-exhausted, or typed incorrectly.
    
#     The UI then shows a banner: "Your API key is invalid — please update it."
    
#     Args:
#         users_col: Motor collection.
#         user_id:   Student's _id.
#     """
#     await users_col.update_one(
#         {"_id": user_id},
#         {"$set": {"free_tier.key_is_valid": False}}
#     )
#     logger.warning("API key marked invalid", user_id=user_id)


# async def delete_user_api_key(
#     users_col: AsyncIOMotorCollection,
#     user_id:   str,
# ) -> bool:
#     """
#     Removes the entire free_tier subdocument from the user's profile.
    
#     Called when:
#       - Student upgrades to Pro (no longer needs their own key)
#       - Student explicitly removes their key from Settings
    
#     Args:
#         users_col: Motor collection.
#         user_id:   Student's _id.
    
#     Returns:
#         True if the field was removed, False if not found.
#     """
#     result = await users_col.update_one(
#         {"_id": user_id},
#         {"$unset": {"free_tier": ""}}
#     )
#     logger.info("API key deleted", user_id=user_id)
#     return result.modified_count > 0











# ==============================================================
# FILE: ishaa_v2/services/key_storage_service.py
#
# PURPOSE:
#   Handles secure storage and retrieval of each free-plan student's
#   personal AI API key (e.g., their own Google Gemini key from
#   aistudio.google.com).
#
# SECURITY DESIGN:
#   ┌──────────────────────────────────────────────────────────┐
#   │  Student pastes key  →  Encrypt (AES-256/Fernet)         │
#   │  → Store ciphertext in MongoDB                           │
#   │  → At request time: decrypt in memory → use → discard   │
#   └──────────────────────────────────────────────────────────┘
#
#   Even if MongoDB is fully compromised, attackers cannot recover
#   the plain-text keys without the KEY_ENCRYPTION_SECRET from .env.
#
#   Fernet (used here) provides:
#     - AES-128-CBC encryption
#     - PKCS7 padding
#     - HMAC-SHA256 authentication (detects tampering)
#     - Timestamp (optional, not enforced here)
#
# PERFORMANCE:
#   Encryption/decryption is pure CPU (microsecond range).
#   The only I/O cost is the MongoDB read/write, which is async.
#   The Fernet object is created ONCE at module load (not per request).
#
# MONGODB FIELD:
#   User document: user.free_tier.encrypted_api_key (string)
#   We project only this field when reading — no full document fetch.
# ==============================================================

import logging
import base64
import hashlib
from typing import Optional
from datetime import datetime, timezone

from cryptography.fernet import Fernet, InvalidToken
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from bson.errors import InvalidId

from config import settings

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# SECTION 1: ENCRYPTOR SINGLETON
#
# The Fernet instance is created once at module import.
# This avoids re-parsing the key on every encrypt/decrypt call.
# If KEY_ENCRYPTION_SECRET is invalid, app crashes at startup —
# which is the correct behavior (fail-fast security principle).
# ─────────────────────────────────────────────────────────────

class _KeyEncryptor:
    """
    AES-256 symmetric encryption wrapper using Fernet.
    Instantiated once as a module-level singleton.
    """

    __slots__ = ("_fernet",)   # Memory optimization — no __dict__ overhead

    def __init__(self, secret: str) -> None:
        """
        Args:
            secret: URL-safe base64-encoded 32-byte key from .env.
                    Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
        
        Raises:
            ValueError: If secret is not a valid Fernet key.
            EnvironmentError: If secret is missing.
        """
        if not secret:
            raise EnvironmentError(
                "KEY_ENCRYPTION_SECRET is not set. "
                "Generate with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        try:
            self._fernet = Fernet(secret.encode())
        except Exception:
            # Backward compatibility: derive a valid Fernet key from plain passphrases.
            derived = base64.urlsafe_b64encode(hashlib.sha256(secret.encode("utf-8")).digest())
            self._fernet = Fernet(derived)

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypts a plain-text API key string.
        
        Args:
            plaintext: Raw API key, e.g. "AIzaSy..."
        
        Returns:
            URL-safe base64-encoded ciphertext string, safe for MongoDB storage.
        """
        return self._fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")

    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypts a stored ciphertext back to the plain-text API key.
        Call this immediately before use; never log or persist the result.
        
        Args:
            ciphertext: The encrypted string stored in MongoDB.
        
        Returns:
            The original plain-text API key.
        
        Raises:
            ValueError: If the token is corrupted, tampered, or encrypted
                        with a different secret key.
        """
        try:
            return self._fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
        except InvalidToken as e:
            raise ValueError(
                "Decryption failed — token invalid, corrupted, or wrong secret key."
            ) from e


# Module-level singleton — initialized once
_encryptor = _KeyEncryptor(settings.KEY_ENCRYPTION_SECRET)


# ─────────────────────────────────────────────────────────────
# SECTION 2: MONGODB OPERATIONS
#
# All operations use field projections to fetch only the fields
# needed — never load the full 2KB+ user document for a key lookup.
# ─────────────────────────────────────────────────────────────

# MongoDB projection for key operations — fetch only free_tier field
_KEY_PROJECTION = {"free_tier": 1, "_id": 0}


def _user_filter(user_id: str) -> dict:
    query = {"_id": user_id}
    try:
        if len(user_id) == 24:
            query = {"$or": [{"_id": user_id}, {"_id": ObjectId(user_id)}]}
    except InvalidId:
        return {"_id": user_id}
    return query


async def save_user_api_key(
    users_col:   AsyncIOMotorCollection,
    user_id:     str,
    raw_api_key: str,
    provider:    str = "gemini",
) -> bool:
    """
    Encrypts and saves a student's personal API key to their MongoDB profile.
    Called when the student submits their key in the Settings page.
    
    Uses $set so it overwrites any previously stored key safely.
    
    Args:
        users_col:   Motor collection for User_Smart_Profile.
        user_id:     Student's _id (string).
        raw_api_key: Plain-text API key as entered by the student.
        provider:    "gemini" | "groq" | "anthropic"
    
    Returns:
        True if saved successfully, False if user not found.
    """
    encrypted = _encryptor.encrypt(raw_api_key)  # Encrypt BEFORE any DB call

    result = await users_col.update_one(
        _user_filter(user_id),
        {
            "$set": {
                "free_tier.encrypted_api_key": encrypted,
                "free_tier.api_key_provider":  provider,
                "free_tier.key_added_at":       datetime.now(timezone.utc),
                "free_tier.key_is_valid":       True,
            }
        }
    )

    if result.matched_count == 0:
        logger.warning(f"save_user_api_key: no document updated user_id={user_id}")
        return False

    logger.info(f"API key saved user_id={user_id} provider={provider}")
    return True


async def get_user_api_key(
    users_col: AsyncIOMotorCollection,
    user_id:   str,
) -> Optional[str]:
    """
    Retrieves and decrypts a student's API key from MongoDB.
    Called right before making an AI API call for free-plan students.
    
    SECURITY: The decrypted key must be used immediately and never
    stored, logged, cached in Redis, or added to any response body.
    
    Args:
        users_col: Motor collection.
        user_id:   Student's _id.
    
    Returns:
        Decrypted plain-text API key, or None if not set / decryption fails.
    """
    # Project only the free_tier field — minimal data transfer
    doc = await users_col.find_one(_user_filter(user_id), _KEY_PROJECTION)

    if not doc:
        return None

    free_tier = doc.get("free_tier", {})
    ciphertext = free_tier.get("encrypted_api_key")

    if not ciphertext:
        return None

    # Check if key was previously marked invalid (saves an API roundtrip)
    if not free_tier.get("key_is_valid", True):
        logger.info(f"get_user_api_key: key marked invalid user_id={user_id}")
        return None

    try:
        return _encryptor.decrypt(ciphertext)
    except ValueError:
        logger.error(f"get_user_api_key: decryption failed user_id={user_id}")
        return None


async def mark_key_invalid(
    users_col: AsyncIOMotorCollection,
    user_id:   str,
) -> None:
    """
    Marks a student's stored API key as invalid.
    
    Called when an AI API call fails with HTTP 401/403 — meaning the
    student's key is revoked, quota-exhausted, or typed incorrectly.
    
    The UI then shows a banner: "Your API key is invalid — please update it."
    
    Args:
        users_col: Motor collection.
        user_id:   Student's _id.
    """
    await users_col.update_one(
        _user_filter(user_id),
        {"$set": {"free_tier.key_is_valid": False}}
    )
    logger.warning(f"API key marked invalid user_id={user_id}")


async def delete_user_api_key(
    users_col: AsyncIOMotorCollection,
    user_id:   str,
) -> bool:
    """
    Removes the entire free_tier subdocument from the user's profile.
    
    Called when:
      - Student upgrades to Pro (no longer needs their own key)
      - Student explicitly removes their key from Settings
    
    Args:
        users_col: Motor collection.
        user_id:   Student's _id.
    
    Returns:
        True if the field was removed, False if not found.
    """
    result = await users_col.update_one(
        _user_filter(user_id),
        {"$unset": {"free_tier": ""}}
    )
    logger.info(f"API key deleted user_id={user_id}")
    return result.modified_count > 0