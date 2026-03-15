import logging
from datetime import date
from decimal import Decimal
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func as sqla_func, extract
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, ConfigDict, Field

from src.core.database import get_db
from src.api.auth import get_current_user
from src.models.cards import Card, CardRewardRule, CardNetwork, CardType, RewardType
from src.models.cashflow.transaction import Transaction
from src.models.cashflow.category import Category
from src.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cards", tags=["Cards"])


# ---------------------------------------------------------------------------
# Shared Pydantic config
# ---------------------------------------------------------------------------

class _CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=lambda s: "".join(
            word.capitalize() if i else word
            for i, word in enumerate(s.split("_"))
        ),
    )


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RewardRuleIn(_CamelModel):
    category_id: int | None = None
    merchant_pattern: str | None = None
    reward_type: Literal["points", "cashback", "miles"] = "points"
    earn_rate: Decimal = Field(default=1, max_digits=10, decimal_places=4)
    earn_per: Decimal = Field(default=100, max_digits=10, decimal_places=2)
    monthly_cap: Decimal | None = None
    priority: int = 0


class RewardRuleOut(_CamelModel):
    id: int
    card_id: int
    category_id: int | None
    merchant_pattern: str | None
    reward_type: str
    earn_rate: Decimal
    earn_per: Decimal
    monthly_cap: Decimal | None
    priority: int


class CardCreate(_CamelModel):
    name: str
    bank: str
    last_four: str | None = None
    network: Literal["visa", "mastercard", "rupay", "amex", "diners"] = "visa"
    card_type: Literal["credit", "debit"] = "credit"
    color: str | None = None
    points_balance: Decimal = 0
    point_value: Decimal = 0
    annual_fee: Decimal = 0
    reward_rules: list[RewardRuleIn] = []


class CardUpdate(_CamelModel):
    name: str | None = None
    bank: str | None = None
    last_four: str | None = None
    network: Literal["visa", "mastercard", "rupay", "amex", "diners"] | None = None
    card_type: Literal["credit", "debit"] | None = None
    color: str | None = None
    points_balance: Decimal | None = None
    point_value: Decimal | None = None
    annual_fee: Decimal | None = None
    is_active: bool | None = None


class CardOut(_CamelModel):
    id: int
    name: str
    bank: str
    last_four: str | None
    network: str
    card_type: str
    color: str | None
    points_balance: Decimal
    point_value: Decimal
    annual_fee: Decimal
    is_active: bool
    reward_rules: list[RewardRuleOut]


class CardSpendSummary(_CamelModel):
    """Per-card spend + reward summary for a given period."""
    card_id: int
    card_name: str
    bank: str
    color: str | None
    total_spend: Decimal
    transaction_count: int
    points_earned: Decimal
    points_value: Decimal  # points_earned * point_value
    reward_rules_count: int


class CategoryRecommendation(_CamelModel):
    """Best card to use for a spending category."""
    category_id: int
    category_name: str
    best_card_id: int
    best_card_name: str
    best_card_bank: str
    best_card_color: str | None
    reward_type: str
    earn_rate: Decimal
    earn_per: Decimal
    effective_rate_pct: Decimal  # e.g. 2.67% back


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _calc_rewards(amount: Decimal, rule: CardRewardRule) -> Decimal:
    """Calculate raw reward units (points/cashback/miles) for a spend amount."""
    if rule.earn_per <= 0:
        return Decimal(0)
    if rule.reward_type == RewardType.cashback:
        # earn_rate is percentage, e.g. 5 → 5%
        return amount * rule.earn_rate / 100
    # points or miles: earn_rate per earn_per spent
    return (amount / rule.earn_per) * rule.earn_rate


def _find_matching_rule(
    rules: list[CardRewardRule],
    category_id: int | None,
    note: str | None,
) -> CardRewardRule | None:
    """Find the highest-priority matching reward rule."""
    sorted_rules = sorted(rules, key=lambda r: r.priority, reverse=True)
    for rule in sorted_rules:
        # Merchant pattern match (highest priority)
        if rule.merchant_pattern and note:
            if rule.merchant_pattern.lower() in note.lower():
                return rule
        # Category match
        if rule.category_id and rule.category_id == category_id:
            if not rule.merchant_pattern:
                return rule
    # Default rule (no category, no merchant)
    for rule in sorted_rules:
        if not rule.category_id and not rule.merchant_pattern:
            return rule
    return None


# ---------------------------------------------------------------------------
# CRUD Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[CardOut])
def list_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cards = (
        db.query(Card)
        .options(joinedload(Card.reward_rules))
        .filter(Card.user_id == current_user.id)
        .order_by(Card.created_at.desc())
        .all()
    )
    return [_card_to_out(c) for c in cards]


@router.post("", response_model=CardOut, status_code=201)
def create_card(
    payload: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = Card(
        user_id=current_user.id,
        name=payload.name,
        bank=payload.bank,
        last_four=payload.last_four,
        network=payload.network,
        card_type=payload.card_type,
        color=payload.color,
        points_balance=payload.points_balance,
        point_value=payload.point_value,
        annual_fee=payload.annual_fee,
    )
    db.add(card)
    db.flush()

    for rule_in in payload.reward_rules:
        rule = CardRewardRule(
            card_id=card.id,
            category_id=rule_in.category_id,
            merchant_pattern=rule_in.merchant_pattern,
            reward_type=rule_in.reward_type,
            earn_rate=rule_in.earn_rate,
            earn_per=rule_in.earn_per,
            monthly_cap=rule_in.monthly_cap,
            priority=rule_in.priority,
        )
        db.add(rule)

    db.commit()
    db.refresh(card)
    logger.info("Created card %d (%s) for user %s", card.id, card.name, current_user.id)
    return _card_to_out(card)


@router.patch("/{card_id}", response_model=CardOut)
def update_card(
    card_id: int,
    payload: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = _get_user_card(db, card_id, current_user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return _card_to_out(card)


@router.delete("/{card_id}", status_code=204)
def delete_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = _get_user_card(db, card_id, current_user.id)
    db.delete(card)
    db.commit()
    logger.info("Deleted card %d for user %s", card_id, current_user.id)


# ---------------------------------------------------------------------------
# Reward Rules CRUD
# ---------------------------------------------------------------------------

@router.post("/{card_id}/rules", response_model=RewardRuleOut, status_code=201)
def add_reward_rule(
    card_id: int,
    payload: RewardRuleIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = _get_user_card(db, card_id, current_user.id)
    rule = CardRewardRule(
        card_id=card.id,
        category_id=payload.category_id,
        merchant_pattern=payload.merchant_pattern,
        reward_type=payload.reward_type,
        earn_rate=payload.earn_rate,
        earn_per=payload.earn_per,
        monthly_cap=payload.monthly_cap,
        priority=payload.priority,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return _rule_to_out(rule)


@router.delete("/{card_id}/rules/{rule_id}", status_code=204)
def delete_reward_rule(
    card_id: int,
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = _get_user_card(db, card_id, current_user.id)
    rule = db.query(CardRewardRule).filter(
        CardRewardRule.id == rule_id,
        CardRewardRule.card_id == card.id,
    ).first()
    if not rule:
        raise HTTPException(404, "Rule not found")
    db.delete(rule)
    db.commit()


# ---------------------------------------------------------------------------
# Analytics Endpoints
# ---------------------------------------------------------------------------

@router.get("/analytics/spend", response_model=list[CardSpendSummary])
def card_spend_analytics(
    month: str = Query(
        default=None,
        description="YYYY-MM format, defaults to current month",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Per-card spend and reward summary for a given month."""
    if month:
        year, mon = map(int, month.split("-"))
    else:
        today = date.today()
        year, mon = today.year, today.month

    cards = (
        db.query(Card)
        .options(joinedload(Card.reward_rules))
        .filter(Card.user_id == current_user.id, Card.is_active == True)
        .all()
    )

    results: list[CardSpendSummary] = []
    for card in cards:
        # Get transactions for this card + month
        txns = (
            db.query(Transaction)
            .filter(
                Transaction.auth_user_id == current_user.id,
                Transaction.card_id == card.id,
                Transaction.type == "expense",
                extract("year", Transaction.transaction_date) == year,
                extract("month", Transaction.transaction_date) == mon,
            )
            .all()
        )

        total_spend = sum(t.amount for t in txns)
        total_points = Decimal(0)
        for t in txns:
            rule = _find_matching_rule(card.reward_rules, t.category_id, t.note)
            if rule:
                total_points += _calc_rewards(t.amount, rule)

        results.append(CardSpendSummary(
            card_id=card.id,
            card_name=card.name,
            bank=card.bank,
            color=card.color,
            total_spend=total_spend,
            transaction_count=len(txns),
            points_earned=total_points,
            points_value=total_points * card.point_value,
            reward_rules_count=len(card.reward_rules),
        ))

    return results


@router.get("/analytics/recommendations", response_model=list[CategoryRecommendation])
def best_card_per_category(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """For each spending category, which card gives the best rewards?"""
    cards = (
        db.query(Card)
        .options(joinedload(Card.reward_rules))
        .filter(Card.user_id == current_user.id, Card.is_active == True)
        .all()
    )

    categories = db.query(Category).filter(Category.type == "expense").all()

    recommendations: list[CategoryRecommendation] = []
    for cat in categories:
        best: dict | None = None
        for card in cards:
            rule = _find_matching_rule(card.reward_rules, cat.id, None)
            if not rule:
                continue

            if rule.reward_type == RewardType.cashback:
                effective_pct = rule.earn_rate
            else:
                # points per ₹: (earn_rate / earn_per) * point_value * 100
                if rule.earn_per > 0:
                    effective_pct = (rule.earn_rate / rule.earn_per) * card.point_value * 100
                else:
                    effective_pct = Decimal(0)

            if best is None or effective_pct > best["effective_pct"]:
                best = {
                    "card": card,
                    "rule": rule,
                    "effective_pct": effective_pct,
                }

        if best:
            recommendations.append(CategoryRecommendation(
                category_id=cat.id,
                category_name=cat.name,
                best_card_id=best["card"].id,
                best_card_name=best["card"].name,
                best_card_bank=best["card"].bank,
                best_card_color=best["card"].color,
                reward_type=best["rule"].reward_type.value,
                earn_rate=best["rule"].earn_rate,
                earn_per=best["rule"].earn_per,
                effective_rate_pct=best["effective_pct"],
            ))

    return recommendations


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_user_card(db: Session, card_id: int, user_id) -> Card:
    card = (
        db.query(Card)
        .options(joinedload(Card.reward_rules))
        .filter(Card.id == card_id, Card.user_id == user_id)
        .first()
    )
    if not card:
        raise HTTPException(404, "Card not found")
    return card


def _card_to_out(card: Card) -> CardOut:
    return CardOut(
        id=card.id,
        name=card.name,
        bank=card.bank,
        last_four=card.last_four,
        network=card.network.value,
        card_type=card.card_type.value,
        color=card.color,
        points_balance=card.points_balance,
        point_value=card.point_value,
        annual_fee=card.annual_fee,
        is_active=card.is_active,
        reward_rules=[_rule_to_out(r) for r in card.reward_rules],
    )


def _rule_to_out(rule: CardRewardRule) -> RewardRuleOut:
    return RewardRuleOut(
        id=rule.id,
        card_id=rule.card_id,
        category_id=rule.category_id,
        merchant_pattern=rule.merchant_pattern,
        reward_type=rule.reward_type.value,
        earn_rate=rule.earn_rate,
        earn_per=rule.earn_per,
        monthly_cap=rule.monthly_cap,
        priority=rule.priority,
    )
