const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RewardRule = {
  id: number;
  cardId: number;
  categoryId: number | null;
  merchantPattern: string | null;
  rewardType: "points" | "cashback" | "miles";
  earnRate: number;
  earnPer: number;
  monthlyCap: number | null;
  priority: number;
};

export type CardData = {
  id: number;
  name: string;
  bank: string;
  lastFour: string | null;
  network: "visa" | "mastercard" | "rupay" | "amex" | "diners";
  cardType: "credit" | "debit";
  color: string | null;
  pointsBalance: number;
  pointValue: number;
  annualFee: number;
  isActive: boolean;
  rewardRules: RewardRule[];
};

export type CardSpendSummary = {
  cardId: number;
  cardName: string;
  bank: string;
  color: string | null;
  totalSpend: number;
  transactionCount: number;
  pointsEarned: number;
  pointsValue: number;
  rewardRulesCount: number;
};

export type CategoryRecommendation = {
  categoryId: number;
  categoryName: string;
  bestCardId: number;
  bestCardName: string;
  bestCardBank: string;
  bestCardColor: string | null;
  rewardType: string;
  earnRate: number;
  earnPer: number;
  effectiveRatePct: number;
};

export type RewardRuleInput = {
  categoryId?: number | null;
  merchantPattern?: string | null;
  rewardType?: "points" | "cashback" | "miles";
  earnRate?: number;
  earnPer?: number;
  monthlyCap?: number | null;
  priority?: number;
};

export type CardCreateInput = {
  name: string;
  bank: string;
  lastFour?: string;
  network?: string;
  cardType?: string;
  color?: string;
  pointsBalance?: number;
  pointValue?: number;
  annualFee?: number;
  rewardRules?: RewardRuleInput[];
};

export type CardUpdateInput = Partial<
  Omit<CardCreateInput, "rewardRules"> & { isActive?: boolean }
>;

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

export async function getCards(): Promise<CardData[]> {
  const res = await fetch(`${API_URL}/cards`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to list cards: ${res.status}`);
  return res.json();
}

export async function createCard(data: CardCreateInput): Promise<CardData> {
  const res = await fetch(`${API_URL}/cards`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create card: ${res.status}`);
  return res.json();
}

export async function updateCard(
  cardId: number,
  data: CardUpdateInput
): Promise<CardData> {
  const res = await fetch(`${API_URL}/cards/${cardId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update card: ${res.status}`);
  return res.json();
}

export async function deleteCard(cardId: number): Promise<void> {
  const res = await fetch(`${API_URL}/cards/${cardId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete card: ${res.status}`);
}

export async function addRewardRule(
  cardId: number,
  data: RewardRuleInput
): Promise<RewardRule> {
  const res = await fetch(`${API_URL}/cards/${cardId}/rules`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to add rule: ${res.status}`);
  return res.json();
}

export async function deleteRewardRule(
  cardId: number,
  ruleId: number
): Promise<void> {
  const res = await fetch(`${API_URL}/cards/${cardId}/rules/${ruleId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete rule: ${res.status}`);
}

export async function getCardSpendAnalytics(
  month?: string
): Promise<CardSpendSummary[]> {
  const params = month ? `?month=${month}` : "";
  const res = await fetch(`${API_URL}/cards/analytics/spend${params}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to get spend analytics: ${res.status}`);
  return res.json();
}

export async function getCardRecommendations(): Promise<
  CategoryRecommendation[]
> {
  const res = await fetch(`${API_URL}/cards/analytics/recommendations`, {
    credentials: "include",
  });
  if (!res.ok)
    throw new Error(`Failed to get recommendations: ${res.status}`);
  return res.json();
}
