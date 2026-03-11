import logging

from sqlalchemy.orm import Session

from src.models.user import User
from src.core.security import verify_google_token, create_access_token

logger = logging.getLogger(__name__)


def authenticate_google_user(db: Session, token: str) -> tuple[str, User] | None:
    """Verify a Google ID token, upsert the user, and return a JWT + User."""

    google_data = verify_google_token(token)

    if not google_data:
        return None

    google_id = google_data["sub"]
    email = google_data["email"]
    name = google_data.get("name")
    avatar = google_data.get("picture")

    user = db.query(User).filter(User.google_id == google_id).first()

    if not user:
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            avatar=avatar,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("Created new user %s (%s)", user.id, email)
    else:
        # Sync profile fields that may have changed on Google's side
        updated = False
        if user.name != name:
            user.name = name
            updated = True
        if user.avatar != avatar:
            user.avatar = avatar
            updated = True
        if user.email != email:
            user.email = email
            updated = True
        if updated:
            db.commit()
            db.refresh(user)
            logger.info("Updated profile for user %s", user.id)

    # Embed key user attributes in the token so downstream handlers
    # can reconstruct the user without querying the database.
    access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
        }
    )

    return access_token, user