import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import (
    String,
    Boolean,
    Integer,
    Numeric,
    DateTime,
    ForeignKey,
    Enum,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class CardNetwork(str, enum.Enum):
    visa = "visa"
    mastercard = "mastercard"
    rupay = "rupay"
    amex = "amex"
    diners = "diners"


class CardType(str, enum.Enum):
    credit = "credit"
    debit = "debit"


class RewardType(str, enum.Enum):
    """How rewards are earned."""
    points = "points"          # e.g. 4 reward points per ₹150
    cashback = "cashback"      # e.g. 5% cashback
    miles = "miles"            # e.g. 2 miles per ₹100


# ---------------------------------------------------------------------------
# Card — represents a user's physical card
# ---------------------------------------------------------------------------

class Card(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    """Friendly name, e.g. 'HDFC Regalia'"""

    bank: Mapped[str] = mapped_column(String(100), nullable=False)
    """Issuing bank, e.g. 'HDFC'"""

    last_four: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    """Last 4 digits (optional convenience)"""

    network: Mapped[CardNetwork] = mapped_column(
        Enum(CardNetwork), nullable=False, default=CardNetwork.visa
    )

    card_type: Mapped[CardType] = mapped_column(
        Enum(CardType), nullable=False, default=CardType.credit
    )

    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    """Hex colour for UI display, e.g. '#1a1a2e'"""

    # Current reward-points balance (user updates from bank app)
    points_balance: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0
    )

    # How much 1 point/mile is worth in ₹ (e.g. 0.20 for HDFC)
    point_value: Mapped[Decimal] = mapped_column(
        Numeric(6, 4), nullable=False, default=0.0
    )

    annual_fee: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=0
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    reward_rules: Mapped[List["CardRewardRule"]] = relationship(
        "CardRewardRule", back_populates="card", cascade="all, delete-orphan"
    )
    transactions: Mapped[List["Transaction"]] = relationship(
        "Transaction", back_populates="card"
    )
    user = relationship("User", back_populates="cards")


# ---------------------------------------------------------------------------
# CardRewardRule — defines how a card earns rewards per spending category
# ---------------------------------------------------------------------------

class CardRewardRule(Base):
    __tablename__ = "card_reward_rules"

    id: Mapped[int] = mapped_column(primary_key=True)

    card_id: Mapped[int] = mapped_column(
        ForeignKey("cards.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Which spending category this rule applies to (NULL = default/all)
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categories.id"), nullable=True
    )

    # Merchant keyword match (optional, e.g. "amazon", "flipkart")
    merchant_pattern: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    reward_type: Mapped[RewardType] = mapped_column(
        Enum(RewardType), nullable=False, default=RewardType.points
    )

    # For points/miles: "earn_rate points per earn_per ₹ spent"
    # e.g. earn_rate=4, earn_per=150 → 4 points per ₹150
    # For cashback: earn_rate=5, earn_per=100 → 5% cashback
    earn_rate: Mapped[Decimal] = mapped_column(
        Numeric(10, 4), nullable=False, default=1
    )
    earn_per: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=100
    )

    # Optional cap on rewards per month
    monthly_cap: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2), nullable=True
    )

    # Priority (higher = checked first). Specific merchant rules should
    # have higher priority than category rules, which beat the default.
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    card: Mapped["Card"] = relationship("Card", back_populates="reward_rules")
    category = relationship("Category")
