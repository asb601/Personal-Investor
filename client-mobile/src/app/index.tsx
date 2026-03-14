import { ScrollView, StatusBar } from 'react-native';
import HeroSection from '@/components/hero-page/HeroSection';

export default function LandingScreen() {
  return (
    <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="always">
      <StatusBar barStyle="light-content" />
      <HeroSection />
    </ScrollView>
  );
}
