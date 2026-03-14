import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, ChevronDown, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/lib/auth';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

export function Header() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [menuVisible, setMenuVisible] = useState(false);
  const initials = user?.name?.slice(0, 1).toUpperCase() ?? user?.email?.slice(0, 1).toUpperCase() ?? 'F';

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: 'rgba(11,11,15,0.95)' }} className="border-b border-border">
      <View className="px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 rounded-2xl bg-primary items-center justify-center">
            <Wallet color="#f8fafc" size={22} />
          </View>
          <View>
            <Text className="text-xl font-bold text-foreground">Expense Wallet</Text>
            <Text className="text-xs text-muted-foreground">Track every rupee</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 rounded-full bg-secondary items-center justify-center">
            <Text className="text-primary-foreground font-semibold text-sm">{initials}</Text>
          </View>

          <Pressable
            onPress={() => setMenuVisible(prev => !prev)}
            className="p-2 rounded-full"
            style={{ backgroundColor: 'rgba(31,31,35,0.6)' }}
          >
            <ChevronDown color="#a1a1aa" size={16} />
          </Pressable>
        </View>
      </View>

      {menuVisible && (
        <View className="mx-4 mb-2 bg-card border border-border rounded-2xl overflow-hidden">
          <Pressable
            className="px-4 py-3 border-b border-border"
            onPress={() => setMenuVisible(false)}
          >
            <Text className="text-sm text-foreground">This Month</Text>
          </Pressable>
          <Pressable
            className="px-4 py-3 border-b border-border"
            onPress={() => setMenuVisible(false)}
          >
            <Text className="text-sm text-foreground">Settings</Text>
          </Pressable>
          <Pressable
            className="px-4 py-3 flex-row gap-2 items-center"
            onPress={handleLogout}
          >
            <LogOut color="#f87171" size={16} />
            <Text className="text-sm font-semibold" style={{ color: '#f87171' }}>Logout</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
