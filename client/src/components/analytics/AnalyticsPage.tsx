'use client';

import { useState } from 'react';
import { Wallet, CreditCard, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTransactionLoader } from './hooks/useTransactionLoader';
import { useAnalytics } from './hooks/useAnalytics';
import { getCurrentMonth } from './utils';
import { AnalyticsToolbar, type ViewMode } from './components/AnalyticsToolbar';
import { StatsOverview } from './components/StatsOverview';
import { MonthlyTrend } from './components/MonthlyTrend';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { TopSpendDays } from './components/TopSpendDays';
import { LargestExpenses } from './components/LargestExpenses';
import { DailyBreakdown } from './components/DailyBreakdown';

const TABS = [
  { id: 'expenses', label: 'Expenses', icon: Wallet, available: true },
  { id: 'cards', label: 'Cards', icon: CreditCard, available: false },
  { id: 'stocks', label: 'Stocks', icon: TrendingUp, available: false },
] as const;

type TabId = (typeof TABS)[number]['id'];

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {label === 'Cards' ? (
          <CreditCard className="w-7 h-7" />
        ) : (
          <TrendingUp className="w-7 h-7" />
        )}
      </div>
      <p className="text-lg font-semibold">{label} Analytics</p>
      <p className="text-sm mt-1">Coming soon</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { transactions, loading } = useTransactionLoader();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [activeTab, setActiveTab] = useState<TabId>('expenses');
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  const analytics = useAnalytics(transactions, selectedMonth, null);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-1 p-1 mb-6 bg-muted/50 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.available && setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : tab.available
                  ? 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  : 'text-muted-foreground/50 cursor-not-allowed'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {!tab.available && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'expenses' && (
        <>
          <AnalyticsToolbar
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          <StatsOverview
            totalIncome={analytics.totalIncome}
            totalExpense={analytics.totalExpense}
            netSavings={analytics.netSavings}
            savingsRate={analytics.savingsRate}
            avgDailySpend={analytics.avgDailySpend}
            txnCount={analytics.txnCount}
            incomeChange={analytics.incomeChange}
            expenseChange={analytics.expenseChange}
          />

          {viewMode === 'monthly' ? (
            <>
              <MonthlyTrend
                trend={analytics.monthlyTrend}
                maxValue={analytics.maxTrendValue}
                selectedMonth={selectedMonth}
                onMonthSelect={setSelectedMonth}
              />

              <CategoryBreakdown
                expenseBreakdown={analytics.categoryBreakdown}
                incomeBreakdown={analytics.incomeBreakdown}
                totalExpense={analytics.totalExpense}
                totalIncome={analytics.totalIncome}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <TopSpendDays
                  days={analytics.topSpendDays}
                  selectedMonth={selectedMonth}
                />
                <LargestExpenses expenses={analytics.largestExpenses} />
              </div>
            </>
          ) : (
            <DailyBreakdown
              data={analytics.dailySpending}
              transactions={transactions}
              selectedMonth={selectedMonth}
              avgDailySpend={analytics.avgDailySpend}
            />
          )}
        </>
      )}

      {activeTab === 'cards' && <ComingSoon label="Cards" />}
      {activeTab === 'stocks' && <ComingSoon label="Stocks" />}
    </div>
  );
}
