import { type Dispatch, type SetStateAction } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import type { FormData } from '@/components/home-page/types';
import type { CategoryName } from '@/lib/category-meta';

export type CategoryMeta = {
  name: CategoryName;
  icon: string;
  color: string;
};

type Props = {
  visible: boolean;
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
  onSubmit: () => void;
  onClose: () => void;
  onPayNow: () => void;
  categories: CategoryMeta[];
  incomeCategories: CategoryMeta[];
};

export function AddTransactionModal({
  visible,
  formData,
  setFormData,
  onSubmit,
  onClose,
  onPayNow,
  categories,
  incomeCategories,
}: Props) {
  const list = formData.type === 'expense' ? categories : incomeCategories;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="bg-card rounded-t-3xl border border-border px-4 pt-4 pb-6">
            <View className="flex-row items-center justify-between pb-4 border-b border-border">
              <Text className="text-sm font-semibold text-muted-foreground">New Transaction</Text>
              <Pressable onPress={onClose} className="p-2 rounded-full bg-secondary/40">
                <X color="#f4f4f5" size={16} />
              </Pressable>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="₹ 0.00"
                value={formData.amount}
                onChangeText={value => setFormData(current => ({ ...current, amount: value }))}
                className="bg-secondary text-primary-foreground rounded-2xl px-4 py-3 text-3xl font-bold font-mono"
              />

              <View className="flex-row bg-secondary rounded-2xl p-1 mt-4">
                <Pressable
                  onPress={() => setFormData(current => ({ ...current, type: 'expense', category: 'Food' }))}
                  className={`flex-1 py-2 rounded-xl ${
                    formData.type === 'expense' ? 'bg-primary' : ''
                  }`}
                >
                  <Text
                    className={`text-center text-xs font-semibold ${
                      formData.type === 'expense' ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Expense
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFormData(current => ({ ...current, type: 'income', category: 'Regular Income' }))}
                  className={`flex-1 py-2 rounded-xl ${
                    formData.type === 'income' ? 'bg-primary' : ''
                  }`}
                >
                  <Text
                    className={`text-center text-xs font-semibold ${
                      formData.type === 'income' ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Income
                  </Text>
                </Pressable>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 -mx-4 px-4">
                <View className="flex-row gap-2">
                  {list.map(category => (
                    <Pressable
                      key={category.name}
                      onPress={() => setFormData(current => ({ ...current, category: category.name }))}
                      className={`px-4 py-2 rounded-full border ${
                        formData.category === category.name ? 'border-transparent' : 'border-border bg-secondary'
                      }`}
                      style={formData.category === category.name ? { backgroundColor: category.color } : undefined}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          formData.category === category.name ? 'text-white' : 'text-secondary-foreground'
                        }`}
                      >
                        {category.icon} {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <View className="flex-row gap-3 mt-4">
                <TextInput
                  value={formData.date}
                  onChangeText={value => setFormData(current => ({ ...current, date: value }))}
                  placeholder="YYYY-MM-DD"
                  className="flex-1 bg-secondary rounded-2xl px-3 py-2 text-xs text-primary-foreground"
                />
                <TextInput
                  value={formData.note}
                  onChangeText={value => setFormData(current => ({ ...current, note: value }))}
                  placeholder="Note (optional)"
                  className="flex-1 bg-secondary rounded-2xl px-3 py-2 text-xs text-primary-foreground"
                />
              </View>
            </ScrollView>

            <View className="flex-row gap-3 mt-5">
              <Pressable className="flex-1 bg-emerald-500 rounded-2xl py-3" onPress={onPayNow}>
                <Text className="text-center font-semibold text-white">Pay Now</Text>
              </Pressable>
              <Pressable className="flex-1 bg-primary rounded-2xl py-3" onPress={onSubmit}>
                <Text className="text-center font-semibold text-primary-foreground">Add Manually</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
