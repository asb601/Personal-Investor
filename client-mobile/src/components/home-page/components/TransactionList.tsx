import { Pressable, ScrollView, Text, View } from 'react-native';
import { Check, Clock, X } from 'lucide-react-native';
import { CATEGORY_META, type CategoryName } from '@/lib/category-meta';
import type { Expense } from '@/components/home-page/types';
import { formatCurrency, formatDate } from '@/lib/utils';

type CategoryMeta = {
  name: CategoryName;
  icon: string;
  color: string;
};

type Props = {
  expenses: Expense[];
  filter: 'all' | CategoryName;
  setFilter: (value: 'all' | CategoryName) => void;
  categories: CategoryMeta[];
  onDelete: (id: number) => void;
  onConfirm: (id: number) => void;
};

export function TransactionList({
  expenses,
  filter,
  setFilter,
  categories,
  onDelete,
  onConfirm,
}: Props) {
  const filteredExpenses = filter === 'all' ? expenses : expenses.filter(expense => expense.category === filter);

  const getCategory = (category: CategoryName) => CATEGORY_META[category];

  return (
    <View className="mb-10">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-4 px-4">
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setFilter('all')}
            className="px-4 py-2 rounded-full border"
            style={{
              backgroundColor: filter === 'all' ? '#1c1c20' : '#000000',
              borderColor: filter === 'all' ? 'transparent' : '#27272a',
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: filter === 'all' ? '#f8fafc' : '#a1a1aa' }}
            >
              All
            </Text>
          </Pressable>

          {categories.map(category => (
            <Pressable
              key={category.name}
              onPress={() => setFilter(category.name)}
              className="px-4 py-2 rounded-full border"
              style={{
                backgroundColor: filter === category.name ? category.color : '#000000',
                borderColor: filter === category.name ? 'transparent' : '#27272a',
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: filter === category.name ? '#ffffff' : '#a1a1aa' }}
              >
                {category.icon} {category.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View className="gap-3">
        {filteredExpenses.map(expense => {
          const meta = getCategory(expense.category);
          return (
            <View key={expense.id} className="bg-card rounded-2xl border border-border p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className="h-11 w-11 rounded-2xl items-center justify-center"
                    style={{
                      backgroundColor: meta.color + '22',
                      borderWidth: 1,
                      borderColor: meta.color,
                    }}
                  >
                    <Text className="text-lg">{meta.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                      {expense.category}
                    </Text>
                    <Text className="text-xs text-muted-foreground">{formatDate(expense.date)}</Text>
                  </View>
                </View>

                <View className="items-end ml-3">
                  {expense.paymentStatus === 'pending' && (
                    <View className="flex-row items-center gap-1 px-2 py-1 rounded-full mb-1" style={{ backgroundColor: 'rgba(245,158,11,0.2)' }}>
                      <Clock color="#fbbf24" size={12} />
                      <Text className="text-xs font-semibold" style={{ color: '#fbbf24' }}>Pending</Text>
                    </View>
                  )}
                  {expense.paymentStatus === 'confirmed' && (
                    <View className="flex-row items-center gap-1 px-2 py-1 rounded-full mb-1" style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}>
                      <Check color="#6ee7b7" size={12} />
                      <Text className="text-xs font-semibold" style={{ color: '#6ee7b7' }}>Confirmed</Text>
                    </View>
                  )}

                  <Text
                    className="text-lg font-bold"
                    style={{
                      fontVariant: ['tabular-nums'],
                      color: expense.type === 'income' ? '#34d399' : '#f87171',
                    }}
                  >
                    {expense.type === 'income' ? '+' : '-'}
                    {formatCurrency(expense.amount)}
                  </Text>

                  <View className="flex-row gap-2 mt-1">
                    {expense.paymentStatus === 'pending' && (
                      <Pressable
                        onPress={() => onConfirm(expense.id)}
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}
                      >
                        <Check color="#6ee7b7" size={16} />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => onDelete(expense.id)}
                      className="p-2 rounded-xl"
                      style={{ backgroundColor: 'rgba(248,113,113,0.1)' }}
                    >
                      <X color="#f87171" size={16} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {!filteredExpenses.length && (
          <View className="py-10 items-center">
            <Text className="text-muted-foreground">No transactions yet.</Text>
          </View>
        )}
      </View>
    </View>
  );
}
