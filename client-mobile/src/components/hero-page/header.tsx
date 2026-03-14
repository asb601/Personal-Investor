import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IndianRupee, Menu, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/lib/auth';
import type { RootStackParamList } from '@/navigation/RootNavigator';

export function HeroHeader() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePrimaryAction = () => {
    navigation.navigate(user ? 'Home' : 'Login');
  };

  return (
    <SafeAreaView edges={['top']} className="px-4 pt-2">
      <View
        className="flex-row items-center justify-between rounded-2xl px-4 py-3 border border-border"
        style={{ backgroundColor: 'rgba(11,11,15,0.85)' }}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 rounded-full bg-primary items-center justify-center">
            <IndianRupee color="#f8fafc" size={24} />
          </View>
          <View>
            <Text className="text-lg font-bold text-foreground">FinOS</Text>
            <Text className="text-xs text-muted-foreground">Personal Investor OS</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handlePrimaryAction}
            className="px-4 py-2 rounded-full bg-primary"
          >
            <Text className="text-primary-foreground font-semibold text-sm">
              {loading ? '...' : user ? 'Dashboard' : 'Login'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMenuOpen(prev => !prev)}
            className="h-10 w-10 rounded-full bg-secondary items-center justify-center"
          >
            {menuOpen ? <X color="#f8fafc" size={18} /> : <Menu color="#f8fafc" size={18} />}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
