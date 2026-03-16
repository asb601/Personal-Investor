# Credit Card Optimization Intelligence — Implementation

> **X-Factor 2** of FinOS — Track credit & debit card spending, maximize rewards, and know which card to use for every purchase.

---

## Architecture Overview

```
User (1) ──→ (N) Card (1) ──→ (N) CardRewardRule
                    │                     │
                    │ FK                  │ FK
                    ▼                     ▼
              Transaction           Category
              (card_id)          (category_id)
```

- Deleting a **User** cascades → all **Cards** (and transitively all **CardRewardRules**)
- Deleting a **Card** cascades → its **CardRewardRules**; sets `card_id = NULL` on linked **Transactions** (`ON DELETE SET NULL`)
- Analytics engine joins `Transaction.card_id` + `Card.reward_rules` + category matching to compute per-card reward earnings
- Recommendations compare all active cards' rules per expense category, computing effective reward rate

---

## 1. Database Layer

### Card Model — `server/src/models/cards/__init__.py`

**Enums:**

| Enum | Values |
|------|--------|
| `CardNetwork` | visa, mastercard, rupay, amex, diners |
| `CardType` | credit, debit |
| `RewardType` | points, cashback, miles |

**`Card` table (`cards`):**

| Field | Type | Notes |
|-------|------|-------|
| `id` | `int` PK | auto-increment |
| `user_id` | `UUID` FK → `users.id` | CASCADE delete, indexed |
| `name` | `String(100)` | e.g. "HDFC Regalia" |
| `bank` | `String(100)` | e.g. "HDFC" |
| `last_four` | `String(4)` | optional |
| `network` | `Enum(CardNetwork)` | default visa |
| `card_type` | `Enum(CardType)` | default credit |
| `color` | `String(20)` | hex colour for UI |
| `points_balance` | `Numeric(12,2)` | user-entered balance |
| `point_value` | `Numeric(6,4)` | ₹ per point |
| `annual_fee` | `Numeric(10,2)` | — |
| `is_active` | `Boolean` | default true |
| `created_at` | `DateTime(tz)` | server_default now() |

Relationships: `reward_rules` (1→N), `transactions` (1→N), `user` (N→1)

**`CardRewardRule` table (`card_reward_rules`):**

| Field | Type | Notes |
|-------|------|-------|
| `id` | `int` PK | — |
| `card_id` | `int` FK → `cards.id` | CASCADE delete, indexed |
| `category_id` | `int` FK → `categories.id` | NULL = default/all |
| `merchant_pattern` | `String(200)` | keyword match on note |
| `reward_type` | `Enum(RewardType)` | points / cashback / miles |
| `earn_rate` | `Numeric(10,4)` | e.g. 4 points or 5% |
| `earn_per` | `Numeric(10,2)` | per ₹ spent, e.g. 150 |
| `monthly_cap` | `Numeric(10,2)` | optional cap |
| `priority` | `int` | higher = checked first |

### Transaction FK

`card_id` added to `Transaction` as `Integer FK → cards.id ON DELETE SET NULL`, nullable, indexed.  
Relationship: `card = relationship("Card", back_populates="transactions")`

### User Relationship

`cards: Mapped[list["Card"]] = relationship(back_populates="user", cascade="all, delete-orphan")`

---

## 2. Migration

**File:** `server/migrations/versions/6b70d8b3c47b_add_cards_reward_rules_and_card_id_on_.py`  
**Revision:** `6b70d8b3c47b` → revises `2d0765fe4722`

**Upgrade:**
1. Create `cards` table (with index on `user_id`)
2. Create `card_reward_rules` table (with index on `card_id`)
3. Add `card_id` column + index + FK on `transactions`

**Downgrade:**
1. Drop FK, index, column on transactions
2. Drop `card_reward_rules`
3. Drop `cards`

---

## 3. Server API — `server/src/api/cards.py`

**466 lines · 8 endpoints · all behind `get_current_user` auth**

### Pydantic Schemas

All use camelCase alias generator via `_CamelModel`:

| Schema | Purpose |
|--------|---------|
| `RewardRuleIn` / `RewardRuleOut` | Rule create / response |
| `CardCreate` | Includes inline `reward_rules: list[RewardRuleIn]` |
| `CardUpdate` | All fields optional (PATCH semantics) |
| `CardOut` | Full card + nested `reward_rules` |
| `CardSpendSummary` | Per-card spend + reward calculation for a period |
| `CategoryRecommendation` | Best card per spending category |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/cards` | All user's cards with eager-loaded rules |
| `POST` | `/cards` | Create card + inline reward rules |
| `PATCH` | `/cards/{card_id}` | Partial update |
| `DELETE` | `/cards/{card_id}` | Cascading delete |
| `POST` | `/cards/{card_id}/rules` | Add rule to existing card |
| `DELETE` | `/cards/{card_id}/rules/{rule_id}` | Remove a rule |
| `GET` | `/cards/analytics/spend?month=YYYY-MM` | Per-card spend + reward summary for month |
| `GET` | `/cards/analytics/recommendations` | Best card for each expense category |

### Reward Calculation Logic

```python
# Cashback: earn_rate is percentage → amount * earn_rate / 100
# Points/Miles: (amount / earn_per) * earn_rate

# Rule matching priority (highest first):
# 1. Merchant pattern match (keyword in transaction note)
# 2. Category match
# 3. Default rule (no category, no merchant)
```

**Effective rate formula:**
- Cashback: `earn_rate` directly (e.g. 5%)
- Points/Miles: `(earn_rate / earn_per) * point_value * 100`

### Transaction API Updates

`TransactionCreate` and `TransactionOut` in `server/src/api/transactions.py` both include `card_id: int | None`.

### Router Registration

`server/src/main.py`: `app.include_router(cards_router)` alongside auth and transaction routers.

---

## 4. Client API Layer — `client/src/actions/cards.ts`

### TypeScript Types

```typescript
CardData          // Full card with nested rewardRules[]
RewardRule        // Single reward rule
CardSpendSummary  // Per-card analytics response
CategoryRecommendation  // Best card per category
CardCreateInput   // Create payload (with optional inline rules)
CardUpdateInput   // Partial update payload
RewardRuleInput   // Rule creation payload
```

### API Functions

| Function | Method | Endpoint | Returns |
|----------|--------|----------|---------|
| `getCards()` | GET | `/cards` | `CardData[]` |
| `createCard(data)` | POST | `/cards` | `CardData` |
| `updateCard(cardId, data)` | PATCH | `/cards/{id}` | `CardData` |
| `deleteCard(cardId)` | DELETE | `/cards/{id}` | `void` |
| `addRewardRule(cardId, data)` | POST | `/cards/{id}/rules` | `RewardRule` |
| `deleteRewardRule(cardId, ruleId)` | DELETE | `/cards/{id}/rules/{rid}` | `void` |
| `getCardSpendAnalytics(month?)` | GET | `/cards/analytics/spend` | `CardSpendSummary[]` |
| `getCardRecommendations()` | GET | `/cards/analytics/recommendations` | `CategoryRecommendation[]` |

All use `credentials: "include"` for cookie-based auth.

### Transaction Action Update

`client/src/actions/transactions.ts` — `addTransaction` accepts `cardId?: number | null` and sends it in the JSON body.

---

## 5. Client UI

### Updated Types — `client/src/components/home-page/types/index.ts`

Both `Expense` and `FormData` types include `cardId?: number | null`.

### Card Selector in Add Transaction Modal

**File:** `client/src/components/home-page/components/AddTransactionModal.tsx`

- Accepts `cards?: CardData[]` prop
- For **expense** transactions when cards exist, renders a `<select>` dropdown:
  - "No card (cash / UPI)" (default)
  - Each card: `{name} ({bank}) ••{lastFour}`
- Writes `cardId` into `formData`
- `HomePage.tsx` fetches cards on mount via `getCards()` and passes them down

### Card Analytics Page — `client/src/components/card-analytics/CardAnalyticsPage.tsx`

**~800 lines · Full analytics dashboard**

#### Sub-components

| Component | Purpose |
|-----------|---------|
| `VisualCard` | Rendered credit/debit card with gradient, bank/network branding, last-4 digits, points badge |
| `StatCard` | Reusable stat tile (icon, title, value, accent colour) |
| `AddCardModal` | Full creation form: name, bank, last-4, network, type toggle, point value, annual fee, 8-color picker, inline rule builder |
| `AddRuleModal` | Standalone modal to add a rule to an existing card |

#### Page Sections (top → bottom)

1. **Toolbar** — Month picker (Popover + Calendar) + "Add Card" button
2. **Stats Row** — 4-column grid:
   - Total Points (amber)
   - Points Value ₹ (emerald)
   - Month Spend ₹
   - Rewards Earned ₹ (emerald)
3. **Card Wallet** — Horizontally scrollable visual cards; click to select
4. **Selected Card Detail** — Two-column grid:
   - Left: card info, quick stats (points / pt value / annual fee), monthly spend summary
   - Right: reward rules list with category icons, delete-on-hover, add button
5. **Spend by Card** — Sorted progress-bar breakdown with colour dots, txn counts, earned rewards
6. **Best Card Recommendations** — Table: category icon → best card (colour dot + name + bank) → effective reward rate %
7. **Empty State** — When no cards exist; CTA to add first card

#### Data Flow

```
fetchAll() → Promise.all([getCards(), getCardSpendAnalytics(month), getCardRecommendations()])
    ↓
State: cards[], spend[], recs[], selectedCardId, selectedMonth
    ↓
Handlers: handleAddCard, handleDeleteCard, handleAddRule, handleDeleteRule
    → Update local state optimistically
    → Refresh analytics via API
```

#### Route

`client/src/app/home/card-analytics/page.tsx` → renders `<CardAnalyticsPage />`

---

## 6. Files Changed / Created

### New Files

| File | Lines | Description |
|------|-------|-------------|
| `server/src/models/cards/__init__.py` | ~90 | Card + CardRewardRule SQLAlchemy models |
| `server/src/api/cards.py` | ~466 | Full CRUD + analytics API |
| `server/migrations/versions/6b70d8b3c47b_...py` | — | Alembic migration |
| `client/src/actions/cards.ts` | ~165 | TypeScript types + API functions |
| `client/src/components/card-analytics/CardAnalyticsPage.tsx` | ~800 | Full analytics dashboard UI |

### Modified Files

| File | Change |
|------|--------|
| `server/src/models/user.py` | Added `cards` relationship |
| `server/src/models/cashflow/transaction.py` | Added `card_id` FK + relationship |
| `server/src/models/__init__.py` | Added Card imports |
| `server/src/main.py` | Registered `cards_router` |
| `server/src/api/transactions.py` | Added `card_id` to schemas + response |
| `client/src/actions/transactions.ts` | Added `cardId` to request payload |
| `client/src/components/home-page/types/index.ts` | Added `cardId` to Expense + FormData |
| `client/src/components/home-page/hooks/useTransactions.ts` | Pass `cardId` through add/markAsPaid |
| `client/src/components/home-page/components/AddTransactionModal.tsx` | Card selector dropdown |
| `client/src/components/home-page/HomePage.tsx` | Fetch cards + pass to modal |
