from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from src.core.config import settings

# The Neon/Postgres server sometimes terminates idle SSL connections
# unpredictably.  enabling `pool_pre_ping` tells SQLAlchemy to test each
# connection before using it and transparently reconnect if the server has
# closed it.  also pass `sslmode` via connect_args in case the URL lacks it.
engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"},
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()

def get_db():
    """Provide a transactional database session to path operations.

    Use as a dependency: db: Session = Depends(get_db).  The
    session is closed automatically after the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
