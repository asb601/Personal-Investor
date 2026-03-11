import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.api.transactions import router as tx_router
from src.api.auth import router as auth_router

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)


# ---------------------------------------------------------------------------
# Lifespan (replaces deprecated @app.on_event)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle hook."""
    # --- startup ---
    _seed_categories()
    logger.info("Server startup complete. Registered routes:")
    for r in app.routes:
        logger.info("  %s -> %s", getattr(r, "path", ""), getattr(r, "name", ""))
    yield
    # --- shutdown ---
    logger.info("Server shutting down.")


def _seed_categories() -> None:
    """Create default categories if the table is empty."""
    from src.core.database import SessionLocal
    from src.models.cashflow.category import Category

    db = SessionLocal()
    try:
        if db.query(Category).count() == 0:
            logger.info("Seeding default categories into database...")
            defaults = [
                {"id": 1, "name": "Food", "type": "expense"},
                {"id": 2, "name": "Transport", "type": "expense"},
                {"id": 3, "name": "Shopping", "type": "expense"},
                {"id": 4, "name": "Entertainment", "type": "expense"},
                {"id": 5, "name": "Bills", "type": "expense"},
                {"id": 6, "name": "Health", "type": "expense"},
                {"id": 7, "name": "Regular Income", "type": "income"},
                {"id": 8, "name": "Bonus", "type": "income"},
                {"id": 9, "name": "Profits", "type": "income"},
            ]
            for c in defaults:
                db.add(Category(**c))
            db.commit()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Personal Investor API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tx_router)
