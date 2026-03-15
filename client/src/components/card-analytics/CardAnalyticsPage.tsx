'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  X,
  CalendarDays,
  Trophy,
  Sparkles,
  ChevronRight,
  Star,
  Wallet,
  TrendingUp,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_META, type CategoryName } from '@/lib/category-meta';
import { CATEGORY_DATA } from '@/lib/category-map-id';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  type CardData,
  type CardSpendSummary,
  type CategoryRecommendation,
  type CardCreateInput,
  type RewardRuleInput,
  getCards,
  createCard,
  deleteCard,
  addRewardRule,
  deleteRewardRule,
  getCardSpendAnalytics,
  getCardRecommendations,
} from '@/actions/cards';

/* =========================================================================
   Helpers
========================================================================= */

const NETWORKS: { value: string; label: string }[] = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'rupay', label: 'RuPay' },
  { value: 'amex', label: 'Amex' },
  { value: 'diners', label: 'Diners' },
];

const CARD_COLORS = [
  '#1e293b', // slate
  '#0f172a', // dark navy
  '#7c3aed', // violet
  '#2563eb', // blue
  '#059669', // emerald
  '#dc2626', // red
  '#d97706', // amber
  '#6366f1', // indigo
];

const EXPENSE_CATEGORIES = CATEGORY_DATA.filter((c) => c.type === 'expense');

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function networkIcon(network: string) {
  switch (network) {
    case 'visa':
      return 'VISA';
    case 'mastercard':
      return 'MC';
    case 'rupay':
      return 'RuPay';
    case 'amex':
      return 'AMEX';
    case 'diners':
      return 'DC';
    default:
      return network.toUpperCase();
  }
}

/* =========================================================================
   Sub-components
========================================================================= */

/** Visual credit/debit card */
function VisualCard({
  card,
  selected,
  onClick,
}: {
  card: CardData;
  selected?: boolean;
  onClick?: () => void;
}) {
  const bg = card.color || '#1e293b';
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full min-w-[260px] max-w-[320px] aspect-[1.586/1] rounded-xl p-5 flex flex-col justify-between text-white shadow-lg transition-all cursor-pointer select-none',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
      style={{
        background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 50%, ${bg}99 100%)`,
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="text-left">
          <p className="text-[10px] uppercase tracking-widest opacity-70">
            {card.bank}
          </p>
          <p className="text-sm font-semibold mt-0.5 truncate max-w-[180px]">
            {card.name}
          </p>
        </div>
        <span className="text-xs font-bold opacity-80 bg-white/10 px-2 py-0.5 rounded">
          {networkIcon(card.network)}
        </span>
      </div>

      {/* Card number */}
      <div className="text-sm font-mono tracking-[0.2em] opacity-80">
        •••• •••• •••• {card.lastFour || '••••'}
      </div>

      {/* Bottom row */}
      <div className="flex items-end justify-between">
        <span className="text-[10px] uppercase tracking-wider opacity-60">
          {card.cardType}
        </span>
        {card.pointsBalance > 0 && (
          <span className="text-xs font-medium bg-white/15 px-2 py-0.5 rounded flex items-center gap-1">
            <Star className="w-3 h-3" />
            {Number(card.pointsBalance).toLocaleString('en-IN')} pts
          </span>
        )}
      </div>
    </button>
  );
}

/** Stats card */
function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="bg-card rounded-lg p-4 sm:p-5 border border-border shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      <div className={cn('text-xl sm:text-2xl font-bold font-mono', accent)}>
        {value}
      </div>
    </div>
  );
}

/* =========================================================================
   ADD CARD MODAL
========================================================================= */

function AddCardModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: CardCreateInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [network, setNetwork] = useState('visa');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [color, setColor] = useState(CARD_COLORS[0]);
  const [pointValue, setPointValue] = useState('0.25');
  const [annualFee, setAnnualFee] = useState('0');
  const [saving, setSaving] = useState(false);

  // Inline reward rules
  const [rules, setRules] = useState<RewardRuleInput[]>([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleCatId, setRuleCatId] = useState<number | null>(null);
  const [ruleType, setRuleType] = useState<'points' | 'cashback' | 'miles'>('points');
  const [ruleRate, setRuleRate] = useState('1');
  const [rulePer, setRulePer] = useState('100');

  const addInlineRule = () => {
    setRules((prev) => [
      ...prev,
      {
        categoryId: ruleCatId,
        rewardType: ruleType,
        earnRate: Number(ruleRate),
        earnPer: Number(rulePer),
        priority: ruleCatId ? 10 : 0,
      },
    ]);
    setShowRuleForm(false);
    setRuleCatId(null);
    setRuleRate('1');
    setRulePer('100');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bank) return;
    setSaving(true);
    try {
      await onSave({
        name,
        bank,
        lastFour: lastFour || undefined,
        network,
        cardType,
        color,
        pointValue: Number(pointValue),
        annualFee: Number(annualFee),
        rewardRules: rules,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border shadow-xl max-h-[90vh] overflow-y-auto"
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-sm font-semibold">Add New Card</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-accent rounded-md transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Card Name & Bank */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Card Name</label>
              <input
                type="text"
                required
                placeholder="HDFC Regalia"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bank</label>
              <input
                type="text"
                required
                placeholder="HDFC"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Last 4 & Network */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Last 4 Digits</label>
              <input
                type="text"
                maxLength={4}
                placeholder="1234"
                value={lastFour}
                onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Network</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {NETWORKS.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card Type toggle */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
              {(['credit', 'debit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCardType(t)}
                  className={cn(
                    'flex-1 py-1.5 rounded-md text-xs font-semibold transition capitalize',
                    cardType === t
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Point value & Annual fee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Point Value (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={pointValue}
                onChange={(e) => setPointValue(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Annual Fee (₹)
              </label>
              <input
                type="number"
                step="1"
                value={annualFee}
                onChange={(e) => setAnnualFee(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Card Color</label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-lg border-2 transition-all',
                    color === c ? 'border-primary scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Reward Rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">Reward Rules</label>
              <button
                type="button"
                onClick={() => setShowRuleForm(true)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Rule
              </button>
            </div>

            {rules.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {rules.map((r, i) => {
                  const cat = EXPENSE_CATEGORIES.find((c) => c.id === r.categoryId);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2 text-xs"
                    >
                      <span>
                        {cat ? cat.name : 'Default (all)'} — {r.earnRate}{' '}
                        {r.rewardType} per ₹{r.earnPer}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRules((prev) => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {showRuleForm && (
              <div className="bg-secondary rounded-lg p-3 space-y-2 border border-border">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Category</label>
                    <select
                      value={ruleCatId ?? ''}
                      onChange={(e) =>
                        setRuleCatId(e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                    >
                      <option value="">All (default)</option>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Reward Type</label>
                    <select
                      value={ruleType}
                      onChange={(e) =>
                        setRuleType(e.target.value as 'points' | 'cashback' | 'miles')
                      }
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                    >
                      <option value="points">Points</option>
                      <option value="cashback">Cashback %</option>
                      <option value="miles">Miles</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      {ruleType === 'cashback' ? 'Cashback %' : 'Earn Rate'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={ruleRate}
                      onChange={(e) => setRuleRate(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Per ₹ Spend</label>
                    <input
                      type="number"
                      step="1"
                      value={rulePer}
                      onChange={(e) => setRulePer(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRuleForm(false)}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addInlineRule}
                    className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name || !bank}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save Card'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================================
   ADD RULE MODAL (standalone, for existing cards)
========================================================================= */

function AddRuleModal({
  cardId,
  onClose,
  onSave,
}: {
  cardId: number;
  onClose: () => void;
  onSave: (cardId: number, rule: RewardRuleInput) => Promise<void>;
}) {
  const [catId, setCatId] = useState<number | null>(null);
  const [ruleType, setRuleType] = useState<'points' | 'cashback' | 'miles'>('points');
  const [rate, setRate] = useState('1');
  const [per, setPer] = useState('100');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(cardId, {
        categoryId: catId,
        rewardType: ruleType,
        earnRate: Number(rate),
        earnPer: Number(per),
        priority: catId ? 10 : 0,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-xl"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h2 className="text-sm font-semibold">Add Reward Rule</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-accent rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Category</label>
            <select
              value={catId ?? ''}
              onChange={(e) => setCatId(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All (default)</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Reward Type</label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as 'points' | 'cashback' | 'miles')}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="points">Points</option>
              <option value="cashback">Cashback %</option>
              <option value="miles">Miles</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {ruleType === 'cashback' ? 'Cashback %' : 'Earn Rate'}
              </label>
              <input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Per ₹ Spend</label>
              <input
                type="number"
                step="1"
                value={per}
                onChange={(e) => setPer(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Add Rule'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================================
   MAIN PAGE
========================================================================= */

export default function CardAnalyticsPage() {
  // --------------- State ---------------
  const [cards, setCards] = useState<CardData[]>([]);
  const [spend, setSpend] = useState<CardSpendSummary[]>([]);
  const [recs, setRecs] = useState<CategoryRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedCardId) ?? null,
    [cards, selectedCardId]
  );

  // --------------- Data fetching ---------------
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsData, spendData, recsData] = await Promise.all([
        getCards(),
        getCardSpendAnalytics(selectedMonth),
        getCardRecommendations(),
      ]);
      setCards(cardsData);
      setSpend(spendData);
      setRecs(recsData);
      // Auto-select first card if none selected
      if (!selectedCardId && cardsData.length > 0) {
        setSelectedCardId(cardsData[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch card data', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedCardId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Refetch spend when month changes
  useEffect(() => {
    getCardSpendAnalytics(selectedMonth)
      .then(setSpend)
      .catch(console.error);
  }, [selectedMonth]);

  // --------------- Handlers ---------------
  const handleAddCard = async (data: CardCreateInput) => {
    const newCard = await createCard(data);
    setCards((prev) => [newCard, ...prev]);
    setSelectedCardId(newCard.id);
    setShowAddCard(false);
    // Refresh analytics
    const [spendData, recsData] = await Promise.all([
      getCardSpendAnalytics(selectedMonth),
      getCardRecommendations(),
    ]);
    setSpend(spendData);
    setRecs(recsData);
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm('Delete this card and all its reward rules?')) return;
    await deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    if (selectedCardId === cardId) {
      setSelectedCardId(cards.find((c) => c.id !== cardId)?.id ?? null);
    }
    const [spendData, recsData] = await Promise.all([
      getCardSpendAnalytics(selectedMonth),
      getCardRecommendations(),
    ]);
    setSpend(spendData);
    setRecs(recsData);
  };

  const handleAddRule = async (cardId: number, rule: RewardRuleInput) => {
    const newRule = await addRewardRule(cardId, rule);
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, rewardRules: [...c.rewardRules, newRule] } : c
      )
    );
    setShowAddRule(false);
    const recsData = await getCardRecommendations();
    setRecs(recsData);
  };

  const handleDeleteRule = async (cardId: number, ruleId: number) => {
    await deleteRewardRule(cardId, ruleId);
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, rewardRules: c.rewardRules.filter((r) => r.id !== ruleId) }
          : c
      )
    );
    const recsData = await getCardRecommendations();
    setRecs(recsData);
  };

  // --------------- Computed ---------------
  const totalPointsBalance = cards.reduce((s, c) => s + Number(c.pointsBalance), 0);
  const totalPointsValue = cards.reduce(
    (s, c) => s + Number(c.pointsBalance) * Number(c.pointValue),
    0
  );
  const monthTotalSpend = spend.reduce((s, c) => s + Number(c.totalSpend), 0);
  const monthTotalRewardsValue = spend.reduce((s, c) => s + Number(c.pointsValue), 0);

  const selectedCardSpend = spend.find((s) => s.cardId === selectedCardId);

  // --------------- EMPTY STATE ---------------

  if (!loading && cards.length === 0) {
    return (
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col items-center justify-center py-16 sm:py-24">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-center">
            Card Analytics
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-8">
            Add your credit &amp; debit cards to track spending, maximize rewards,
            and see which card to use for each category.
          </p>
          <button
            onClick={() => setShowAddCard(true)}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Your First Card
          </button>
        </div>

        {showAddCard && <AddCardModal onClose={() => setShowAddCard(false)} onSave={handleAddCard} />}
      </div>
    );
  }

  // --------------- MAIN RENDER ---------------

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* ===== Toolbar ===== */}
      <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Month picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium transition-colors',
                  'bg-secondary/50 hover:bg-accent text-foreground'
                )}
              >
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                {formatMonthLabel(selectedMonth)}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={(() => {
                  const [y, m] = selectedMonth.split('-').map(Number);
                  return new Date(y, m - 1, 1);
                })()}
                onSelect={(date) => {
                  if (date) {
                    const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    setSelectedMonth(ym);
                    setCalendarOpen(false);
                  }
                }}
                disabled={{ after: new Date() }}
                defaultMonth={(() => {
                  const [y, m] = selectedMonth.split('-').map(Number);
                  return new Date(y, m - 1);
                })()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <button
          onClick={() => setShowAddCard(true)}
          className="bg-primary text-primary-foreground px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Card</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* ===== Stats Row ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Points"
          value={totalPointsBalance.toLocaleString('en-IN')}
          icon={Star}
          accent="text-amber-400"
        />
        <StatCard
          title="Points Value"
          value={`₹${totalPointsValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          icon={Wallet}
          accent="text-emerald-400"
        />
        <StatCard
          title="Month Spend"
          value={`₹${monthTotalSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Rewards Earned"
          value={`₹${monthTotalRewardsValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
          icon={Gift}
          accent="text-emerald-400"
        />
      </div>

      {/* ===== Card Wallet (horizontal scroll) ===== */}
      <div className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Your Cards
        </h3>
        <div
          className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {cards.map((card) => (
            <div key={card.id} className="flex-shrink-0">
              <VisualCard
                card={card}
                selected={selectedCardId === card.id}
                onClick={() => setSelectedCardId(card.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ===== Selected Card Detail ===== */}
      {selectedCard && (
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {/* Card Info + Actions */}
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">{selectedCard.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedCard.bank} · {selectedCard.network.toUpperCase()} · {selectedCard.cardType}
                </p>
              </div>
              <button
                onClick={() => handleDeleteCard(selectedCard.id)}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                title="Delete card"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Quick stats for this card */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Points</p>
                <p className="text-lg font-bold font-mono text-amber-400">
                  {Number(selectedCard.pointsBalance).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Pt Value</p>
                <p className="text-lg font-bold font-mono">
                  ₹{Number(selectedCard.pointValue)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Annual Fee</p>
                <p className="text-lg font-bold font-mono">
                  ₹{Number(selectedCard.annualFee).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Month spend for this card */}
            {selectedCardSpend && (
              <div className="bg-secondary rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This Month Spend</span>
                  <span className="font-mono font-medium">
                    ₹{Number(selectedCardSpend.totalSpend).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="font-mono font-medium">{selectedCardSpend.transactionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rewards Earned</span>
                  <span className="font-mono font-medium text-emerald-400">
                    {Number(selectedCardSpend.pointsEarned).toLocaleString('en-IN', { maximumFractionDigits: 1 })}{' '}
                    pts (₹{Number(selectedCardSpend.pointsValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reward Rules */}
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Reward Rules
              </h3>
              <button
                onClick={() => setShowAddRule(true)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {selectedCard.rewardRules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-2">No reward rules yet</p>
                <button
                  onClick={() => setShowAddRule(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Add your first rule
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto">
                {selectedCard.rewardRules.map((rule) => {
                  const cat = EXPENSE_CATEGORIES.find((c) => c.id === rule.categoryId);
                  const catMeta = cat
                    ? CATEGORY_META[cat.name as CategoryName]
                    : null;
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2.5 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">
                          {catMeta ? catMeta.icon : '🌐'}
                        </span>
                        <div>
                          <p className="text-xs font-medium">
                            {cat ? cat.name : 'Default (all categories)'}
                            {rule.merchantPattern && (
                              <span className="text-muted-foreground ml-1">
                                · {rule.merchantPattern}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {rule.rewardType === 'cashback'
                              ? `${rule.earnRate}% cashback`
                              : `${rule.earnRate} ${rule.rewardType} per ₹${rule.earnPer}`}
                            {rule.monthlyCap != null && ` · cap ₹${rule.monthlyCap}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(selectedCard.id, rule.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Spend per Card (bar-like breakdown) ===== */}
      {spend.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Spend by Card — {formatMonthLabel(selectedMonth)}
          </h3>
          <div className="space-y-2">
            {spend
              .filter((s) => Number(s.totalSpend) > 0)
              .sort((a, b) => Number(b.totalSpend) - Number(a.totalSpend))
              .map((s) => {
                const pct = monthTotalSpend > 0 ? (Number(s.totalSpend) / monthTotalSpend) * 100 : 0;
                const card = cards.find((c) => c.id === s.cardId);
                return (
                  <div
                    key={s.cardId}
                    className="bg-card rounded-lg border border-border p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/30 transition"
                    onClick={() => setSelectedCardId(s.cardId)}
                  >
                    {/* Color dot */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: s.color || '#6366f1' }}
                    />
                    {/* Name + bank */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{s.cardName}</p>
                        <p className="text-sm font-mono font-semibold ml-2">
                          ₹{Number(s.totalSpend).toLocaleString('en-IN')}
                        </p>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: s.color || '#6366f1',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {s.transactionCount} txns
                        </span>
                        <span className="text-[10px] text-emerald-400">
                          +{Number(s.pointsEarned).toLocaleString('en-IN', { maximumFractionDigits: 1 })} pts
                          (₹{Number(s.pointsValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ===== Best Card Recommendations ===== */}
      {recs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Best Card per Category
          </h3>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_auto] text-[10px] uppercase tracking-wider text-muted-foreground px-4 py-2.5 border-b border-border bg-secondary/30">
              <span>Category</span>
              <span>Best Card</span>
              <span className="text-right">Reward</span>
            </div>
            {recs.map((rec) => {
              const catMeta = CATEGORY_META[rec.categoryName as CategoryName];
              return (
                <div
                  key={rec.categoryId}
                  className="grid grid-cols-[1fr_1fr_auto] items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-accent/20 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{catMeta?.icon ?? '📦'}</span>
                    <span className="text-sm">{rec.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: rec.bestCardColor || '#6366f1' }}
                    />
                    <div>
                      <p className="text-sm font-medium truncate">{rec.bestCardName}</p>
                      <p className="text-[10px] text-muted-foreground">{rec.bestCardBank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-emerald-400">
                      {Number(rec.effectiveRatePct).toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {rec.rewardType === 'cashback'
                        ? 'cashback'
                        : `${rec.earnRate} ${rec.rewardType}/₹${rec.earnPer}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== Loading overlay ===== */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ===== Modals ===== */}
      {showAddCard && (
        <AddCardModal onClose={() => setShowAddCard(false)} onSave={handleAddCard} />
      )}
      {showAddRule && selectedCardId && (
        <AddRuleModal
          cardId={selectedCardId}
          onClose={() => setShowAddRule(false)}
          onSave={handleAddRule}
        />
      )}
    </div>
  );
}
