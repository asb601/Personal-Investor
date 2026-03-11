import logging
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from google.oauth2 import id_token
from google.auth.transport import requests

from src.core.config import settings

logger = logging.getLogger(__name__)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=ALGORITHM,
    )

    return encoded_jwt


def verify_google_token(token: str) -> dict | None:
    """Verify a Google OAuth2 ID token.

    Returns the decoded payload on success, or ``None`` on failure.
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.google_client_id,
        )
        return idinfo
    except ValueError:
        logger.warning("Google token verification failed")
        return None


def decode_access_token(token: str) -> dict | None:
    """Decode and verify an HS256 JWT produced by ``create_access_token``.

    Returns the payload dict on success, or ``None`` if verification fails.
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        logger.warning("JWT decode failed")
        return None
    except ValueError:
        return None