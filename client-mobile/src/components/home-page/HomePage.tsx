import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/lib/auth';
import { CATEGORY_META, type CategoryName } from '@/lib/category-meta';
import type { FormData } from '@/components/home-page/types';
import { useTransactions } from '@/components/home-page/hooks/useTransactions';
import { Header } from '@/components/home-page/components/Header';
import { StatsBar } from '@/components/home-page/components/StatsBar';
import { CategoryBreakdown } from '@/components/home-page/components/CategoryBreakdown';
import { TransactionList } from '@/components/home-page/components/TransactionList';
import { AddTransactionModal } from '@/components/home-page/components/AddTransactionModal';
import { PaymentModal } from '@/components/home-page/components/PaymentModal';
import type { RootStackParamList } from '@/navigation/RootNavigator';

const categories = Object.entries(CATEGORY_META)
  .filter(([, value]) => value.type === 'expense')
  .map(([name, meta]) => ({
    name: name as CategoryName,
    icon: meta.icon,
    color: meta.color,
  }));

const incomeCategories = Object.entries(CATEGORY_META)
  .filter(([, value]) => value.type === 'income')
  .map(([name, meta]) => ({
    name: name as CategoryName,
    icon: meta.icon,
    color: meta.color,
  }));

export default function HomePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loading } = useAuth();
  const { expenses, addExpense, deleteExpense, markAsPaid, confirmExpense } = useTransactions();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filter, setFilter] = useState<'all' | CategoryName>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'gpay' | 'phonepe' | 'paytm' | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [formData, setFormData] = useState<FormData>({
    amount: '',
    category: 'Food',
    note: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [loading, navigation, user]);

  const totals = useMemo(() => {
    const totalExpenses = expenses
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalIncome = expenses
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const leftInWallet = totalIncome - totalExpenses;

    const categoryTotals = categories
      .map(category => ({
        ...category,
        total: expenses
          .filter(entry => entry.type === 'expense' && entry.category === category.name)
          .reduce((sum, entry) => sum + entry.amount, 0),
      }))
      .filter(category => category.total > 0);

    return { totalExpenses, totalIncome, leftInWallet, categoryTotals };
  }, [expenses]);

  const handleAddExpense = async () => {
    await addExpense(formData, () => {
      setFormData(prev => ({
        amount: '',
        category: prev.type === 'income' ? 'Regular Income' : 'Food',
        note: '',
        date: new Date().toISOString().split('T')[0],
        type: prev.type,
      }));
      setShowAddModal(false);
    });
  };

  const handlePay = async (method: 'gpay' | 'phonepe' | 'paytm') => {
    if (!formData.amount) {
      return;
    }
    setSelectedPaymentMethod(method);
    await markAsPaid(formData, method);
    setFormData(prev => ({
      amount: '',
      category: prev.type === 'income' ? 'Regular Income' : 'Food',
      note: '',
      date: new Date().toISOString().split('T')[0],
      type: prev.type,
    }));
    setShowPaymentModal(false);
    setShowAddModal(false);
  };

  if (loading || !user) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#f4f4f5" />
        <Text className="text-muted-foreground mt-4">Preparing your dashboard…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header />

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 96 }} contentInsetAdjustmentBehavior="automatic">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-lg font-semibold text-foreground">Dashboard</Text>
            <Text className="text-xs text-muted-foreground">Personal Investor OS</Text>
          </View>
          <TextInput
            value={selectedMonth}
            onChangeText={setSelectedMonth}
            placeholder="YYYY-MM"
            placeholderTextColor="#71717a"
            className="px-3 py-2 rounded-lg bg-secondary min-w-[110px] text-center"
            style={{ color: '#d4d4d8' }}
          />
        </View>

        <StatsBar
          totalIncome={totals.totalIncome}
          totalExpenses={totals.totalExpenses}
          leftInWallet={totals.leftInWallet}
          categoryTotals={totals.categoryTotals}
        />

        <CategoryBreakdown
          categoryTotals={totals.categoryTotals}
          totalExpenses={totals.totalExpenses}
        />

        <TransactionList
          expenses={expenses}
          filter={filter}
          setFilter={setFilter}
          categories={categories}
          onDelete={deleteExpense}
          onConfirm={confirmExpense}
        />
      </ScrollView>

      <Pressable
        className="absolute bottom-8 right-6 h-14 w-14 rounded-full bg-primary items-center justify-center shadow-lg"
        onPress={() => setShowAddModal(true)}
      >
        <Plus color="#f8fafc" size={28} />
      </Pressable>

      <AddTransactionModal
        visible={showAddModal}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddExpense}
        onPayNow={() => setShowPaymentModal(true)}
        categories={categories}
        incomeCategories={incomeCategories}
      />

      <PaymentModal
        visible={showPaymentModal}
        amount={formData.amount}
        onClose={() => setShowPaymentModal(false)}
        onPay={handlePay}
        selectedMethod={selectedPaymentMethod}
        setSelectedMethod={setSelectedPaymentMethod}
      />
    </View>
  );
}
