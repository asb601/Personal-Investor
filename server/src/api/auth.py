import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel

from src.core.database import get_db
from src.services.auth_service import authenticate_google_user
from src.core.security import decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from src.core.config import settings
from src.models.user import User

logger = logging.getLogger(__name__)

# OAuth2 scheme used for bearer token dependency.  we set
# `auto_error=False` so that the dependency returns None instead of
# raising an HTTPException when no Authorization header is present.  this
# lets `get_current_user` fall back to the cookie value.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/google", auto_error=False)

router = APIRouter(prefix="/auth", tags=["Auth"])


# request model used by /auth/google
class TokenPayload(BaseModel):
    token: str


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    access_token: str | None = Cookie(None),
) -> User:
    """Resolve the current user from a bearer token or httpOnly cookie."""

    # prefer bearer token if provided, otherwise fall back to cookie
    if not token and access_token:
        token = access_token

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    try:
        user_id = uuid.UUID(payload["sub"])
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed user id in token")

    # Reconstruct a lightweight User from the JWT payload.
    user = User(
        id=user_id,
        email=payload.get("email"),
        name=payload.get("name"),
        avatar=payload.get("avatar"),
    )
    return user


@router.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    """Return the profile of whichever user corresponds to the bearer token."""
    return current_user


@router.post("/google")
def google_login(
    payload: TokenPayload,
    response: Response,
    db: Session = Depends(get_db),
):
    """Accept a JSON body containing a Google ID token, issue an access
    token and set it in a secure http-only cookie."""
    result = authenticate_google_user(db, payload.token)

    if not result:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    access_token, user = result
    logger.info("Issuing token for user %s (debug=%s)", user.id, settings.debug)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return {
        "access_token": access_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
        },
    }


@router.post("/logout")
def logout(response: Response):
    """Clear the authentication cookie."""
    response.delete_cookie("access_token")
    return {"detail": "logged out"}