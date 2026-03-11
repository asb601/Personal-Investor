import logging
from datetime import date
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict, Field

from src.core.database import get_db
from src.api.auth import get_current_user
from src.models.cashflow.transaction import Transaction
from src.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# ---------------------------------------------------------------------------
# Shared Pydantic config — output camelCase aliases so the frontend can read
# `categoryId` instead of `category_id`.
# ---------------------------------------------------------------------------

class _CamelModel(BaseModel):
    """Base model that serialises field names as camelCase."""

    model_config = ConfigDict(
        populate_by_name=True,  # accept both snake_case & camelCase input
        alias_generator=lambda s: "".join(
            word.capitalize() if i else word
            for i, word in enumerate(s.split("_"))
        ),
    )


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class TransactionCreate(_CamelModel):
    category_id: int
    amount: Decimal = Field(max_digits=12, decimal_places=2)
    type: Literal["expense", "income"]
    note: str | None = None
    date: date  # ISO date (YYYY-MM-DD)
    is_recurring: bool = False
    payment_method: Literal["gpay", "phonepe", "paytm"] | None = None
    payment_id: str | None = None
    payment_status: Literal["pending", "confirmed", "manual"] = "manual"


class TransactionOut(_CamelModel):
    id: int
    category_id: int
    amount: Decimal
    type: Literal["expense", "income"]
    note: str | None
    date: date
    is_recurring: bool
    payment_method: str | None
    payment_id: str | None
    payment_status: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[TransactionOut])
def list_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TransactionOut]:
    """Return all transactions belonging to the current user."""
    rows = (
        db.query(Transaction)
        .filter(Transaction.auth_user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .all()
    )
    return [
        TransactionOut(
            id=r.id,
            category_id=r.category_id,
            amount=r.amount,
            type=r.type,
            note=r.note,
            date=r.transaction_date,
            is_recurring=r.is_recurring,
            payment_method=r.payment_method.value if r.payment_method else None,
            payment_id=r.payment_id,
            payment_status=r.payment_status.value,
        )
        for r in rows
    ]


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    tx: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionOut:
    """Insert a new transaction for the logged-in user."""
    from src.models.cashflow.category import Category

    cat = db.query(Category).filter(Category.id == tx.category_id).first()
    if not cat:
        raise HTTPException(status_code=400, detail="Invalid category_id")

    new = Transaction(
        auth_user_id=current_user.id,
        category_id=tx.category_id,
        amount=tx.amount,
        type=tx.type,
        note=tx.note,
        transaction_date=tx.date,
        is_recurring=tx.is_recurring,
        payment_method=tx.payment_method,
        payment_id=tx.payment_id,
        payment_status=tx.payment_status,
    )
    db.add(new)
    db.commit()
    db.refresh(new)

    logger.info("Created transaction %d for user %s", new.id, current_user.id)

    return TransactionOut(
        id=new.id,
        category_id=new.category_id,
        amount=new.amount,
        type=new.type,
        note=new.note,
        date=new.transaction_date,
        is_recurring=new.is_recurring,
        payment_method=new.payment_method.value if new.payment_method else None,
        payment_id=new.payment_id,
        payment_status=new.payment_status.value,
    )


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(
    tx_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a transaction owned by the current user."""
    row = (
        db.query(Transaction)
        .filter(Transaction.id == tx_id, Transaction.auth_user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(row)
    db.commit()
    logger.info("Deleted transaction %d for user %s", tx_id, current_user.id)


@router.patch("/{tx_id}/confirm", response_model=TransactionOut)
def confirm_transaction(
    tx_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionOut:
    """Mark a pending transaction as confirmed after the user completes payment."""
    from src.models.cashflow.transaction import PaymentStatusEnum

    row = (
        db.query(Transaction)
        .filter(Transaction.id == tx_id, Transaction.auth_user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if row.payment_status == PaymentStatusEnum.confirmed:
        raise HTTPException(status_code=400, detail="Already confirmed")

    row.payment_status = PaymentStatusEnum.confirmed
    db.commit()
    db.refresh(row)
    logger.info("Confirmed transaction %d for user %s", tx_id, current_user.id)

    return TransactionOut(
        id=row.id,
        category_id=row.category_id,
        amount=row.amount,
        type=row.type,
        note=row.note,
        date=row.transaction_date,
        is_recurring=row.is_recurring,
        payment_method=row.payment_method.value if row.payment_method else None,
        payment_id=row.payment_id,
        payment_status=row.payment_status.value,
    )