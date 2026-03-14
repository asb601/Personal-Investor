import { Dimensions, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight } from 'lucide-react-native';
import { HeroHeader } from '@/components/hero-page/header';
import { InfiniteSlider } from '@/components/ui/InfiniteSlider';
import { useAuth } from '@/lib/auth';
import type { RootStackParamList } from '@/navigation/RootNavigator';

const SLIDER_ITEMS = ['Track Income', 'Optimize Spending', 'Smart Investments'];
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HeroSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const handleStart = () => {
    navigation.navigate(user ? 'Home' : 'Login');
  };

  return (
    <View className="bg-background" style={{ minHeight: SCREEN_HEIGHT }}>
      <HeroHeader />

      <View className="flex-1 justify-center px-6 pb-12">
        <Text className="text-4xl font-bold text-foreground" style={{ lineHeight: 44 }}>
          Personal Financial{"\n"}Intelligence OS
        </Text>
        <Text className="mt-4 text-base text-muted-foreground">
          Internal system for tracking income, optimizing spending, and making research-driven investment decisions.
        </Text>

        <Pressable
          onPress={handleStart}
          className="mt-8 flex-row items-center self-start gap-2 bg-primary px-6 py-4 rounded-full"
        >
          <Text className="text-primary-foreground font-semibold text-base">
            {user ? 'Open Dashboard' : 'Start Building'}
          </Text>
          <ChevronRight color="#f8fafc" size={20} />
        </Pressable>

        <View className="mt-16">
          <View className="h-px bg-border self-center" style={{ width: '50%' }} />
          <View className="mt-6">
            <Text className="text-sm text-muted-foreground mb-3 text-center">Powering the best teams</Text>
            <InfiniteSlider items={SLIDER_ITEMS} speed={30} />
          </View>
        </View>
      </View>
    </View>
  );
}
