from datetime import datetime
from typing import List

from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(100), nullable=False)

    type: Mapped[str] = mapped_column(String(20), nullable=False)  # expense | income

    icon: Mapped[str | None] = mapped_column(String(10))

    color: Mapped[str | None] = mapped_column(String(50))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    transactions: Mapped[List["Transaction"]] = relationship(
        back_populates="category"
    )