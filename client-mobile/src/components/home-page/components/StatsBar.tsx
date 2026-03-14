import { View, Text } from 'react-native';
import type { CategoryName } from '@/lib/category-meta';
import { formatCurrency } from '@/lib/utils';

export type CategoryTotal = {
  name: CategoryName;
  icon: string;
  color: string;
  total: number;
};

type Props = {
  totalIncome: number;
  totalExpenses: number;
  leftInWallet: number;
  categoryTotals: CategoryTotal[];
};

export function StatsBar({ totalIncome, totalExpenses, leftInWallet, categoryTotals }: Props) {
  const topCategory = categoryTotals.length
    ? categoryTotals.reduce((max, entry) => (entry.total > max.total ? entry : max), categoryTotals[0])
    : null;

  return (
    <View className="mb-4">
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 bg-card rounded-2xl border border-border px-4 py-4">
          <Text className="text-xs uppercase tracking-widest text-muted-foreground">Income</Text>
          <Text className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totalIncome)}</Text>
        </View>
        <View className="flex-1 bg-card rounded-2xl border border-border px-4 py-4">
          <Text className="text-xs uppercase tracking-widest text-muted-foreground">Spent</Text>
          <Text className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalExpenses)}</Text>
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1 bg-card rounded-2xl border border-border px-4 py-4">
          <Text className="text-xs uppercase tracking-widest text-muted-foreground">Balance</Text>
          <Text
            className="text-2xl font-bold mt-1"
            style={{ color: leftInWallet >= 0 ? '#34d399' : '#f87171' }}
          >
            {formatCurrency(leftInWallet)}
          </Text>
        </View>
        <View className="flex-1 bg-card rounded-2xl border border-border px-4 py-4">
          <Text className="text-xs uppercase tracking-widest text-muted-foreground">Top Category</Text>
          <Text className="text-lg font-semibold text-foreground mt-1" numberOfLines={1}>
            {topCategory ? `${topCategory.icon} ${topCategory.name}` : 'None'}
          </Text>
        </View>
      </View>
    </View>
  );
}
