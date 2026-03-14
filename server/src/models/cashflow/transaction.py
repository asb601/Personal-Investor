import enum
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    String,
    Boolean,
    Integer,
    Date,
    Numeric,
    DateTime,
    ForeignKey,
    Enum,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class PaymentMethodEnum(str, enum.Enum):
    gpay = "gpay"
    phonepe = "phonepe"
    paytm = "paytm"


class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    manual = "manual"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)

    auth_user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"),
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    type: Mapped[str] = mapped_column(String(20), nullable=False)

    note: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)

    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)

    payment_method: Mapped[Optional[PaymentMethodEnum]] = mapped_column(
        Enum(PaymentMethodEnum),
        nullable=True,
    )

    payment_id: Mapped[Optional[str]] = mapped_column(String(255))

    payment_status: Mapped[PaymentStatusEnum] = mapped_column(
        Enum(PaymentStatusEnum),
        nullable=False,
        default=PaymentStatusEnum.manual,
        server_default="manual",
    )

    card_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("cards.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    user: Mapped["User"] = relationship(back_populates="transactions")
    category: Mapped["Category"] = relationship(back_populates="transactions")
    card = relationship("Card", back_populates="transactions")