"use client";

import React, { createContext, useState, useEffect, useContext } from "react";

interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => { },
  logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // when the provider mounts, ask the backend for the current user.  the
  // server will look for the http-only cookie and return 401 if it's
  // missing/invalid.  we don't persist anything client-side aside from user
  // info held in memory.
  useEffect(() => {
    async function fetchMe() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const u = await res.json();
          setUser(u);
        }
      } catch (err) {
        console.error("failed to fetch current user", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, []);

  const login = (u: User) => {
    setUser(u);
  };

  const logout = () => {
    setUser(null);
    // optionally tell server to clear cookie
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => { });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
