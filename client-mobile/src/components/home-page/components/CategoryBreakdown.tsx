import { View, Text } from 'react-native';
import { PieChart } from 'lucide-react-native';
import type { CategoryTotal } from './StatsBar';

type Props = {
  categoryTotals: CategoryTotal[];
  totalExpenses: number;
};

export function CategoryBreakdown({ categoryTotals, totalExpenses }: Props) {
  if (!categoryTotals.length || totalExpenses <= 0) {
    return null;
  }

  return (
    <View className="bg-card rounded-2xl border border-border p-5 mb-6">
      <View className="flex-row items-center gap-2 mb-5">
        <PieChart color="#6366f1" size={20} />
        <Text className="text-lg font-semibold text-foreground">Category Breakdown</Text>
      </View>

      <View className="gap-4">
        {categoryTotals.map(category => {
          const percentage = (category.total / totalExpenses) * 100;
          return (
            <View key={category.name}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl">{category.icon}</Text>
                  <Text className="text-foreground font-medium">{category.name}</Text>
                </View>
                <Text className="text-foreground" style={{ fontVariant: ['tabular-nums'] }}>
                  ₹{category.total.toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="h-2 rounded-full bg-muted overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${percentage}%`, backgroundColor: category.color }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
