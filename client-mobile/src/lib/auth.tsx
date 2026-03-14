import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  [key: string]: unknown;
};

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (payload: User) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const STORAGE_KEY = '@finos:user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached && mounted) {
          setUser(JSON.parse(cached));
        }

        const res = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setUser(data);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
        } else if (mounted) {
          setUser(null);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('failed to fetch current user', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (payload: User) => {
    setUser(payload);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('failed to logout', error);
    } finally {
      setUser(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  };

  const refresh = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('failed to refresh user', error);
    }
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
