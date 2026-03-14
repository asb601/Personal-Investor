import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IndianRupee } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import type { RootStackParamList } from '@/navigation/RootNavigator';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function LoginPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loading, login } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (!loading && user) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }, [loading, user, navigation]);

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.params?.id_token;
      if (token) {
        handleSuccess(token);
      }
    }
  }, [response]);

  const handleSuccess = async (googleToken: string) => {
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: googleToken }),
      });

      if (!res.ok) {
        throw new Error(`server responded with ${res.status}`);
      }

      const data = await res.json();
      if (data.user) {
        await login(data.user);
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading || isLoggingIn) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#f8fafc" size="large" />
        <Text className="text-muted-foreground mt-4">
          {isLoggingIn ? 'Signing you in…' : 'Checking session…'}
        </Text>
      </View>
    );
  }

  const handleLoginPress = () => {
    promptAsync().catch(() => null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <View className="bg-card rounded-3xl border border-border p-6">
          <View className="items-center mb-8">
            <View className="h-16 w-16 rounded-full bg-primary items-center justify-center mb-4">
              <IndianRupee color="#f8fafc" size={32} />
            </View>
            <Text className="text-3xl font-bold text-foreground">Welcome Back</Text>
            <Text className="text-center text-muted-foreground mt-2">
              Sign in to your Personal Financial Intelligence OS
            </Text>
          </View>

          <Pressable
            disabled={!request}
            onPress={handleLoginPress}
            className="py-4 rounded-2xl border border-border items-center"
            style={{ backgroundColor: request ? '#ffffff' : '#27272a' }}
          >
            <Text className="text-base font-semibold" style={{ color: request ? '#000000' : '#a1a1aa' }}>
              Continue with Google
            </Text>
          </Pressable>

          <Text className="text-center text-xs text-muted-foreground mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
