import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';

export interface User {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string) => Promise<{ error?: string; confirmEmail?: boolean }>;
  forgotPassword: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AUTH_TOKEN_KEY = '@rigor_auth_token';
const AUTH_REFRESH_KEY = '@rigor_auth_refresh';
const AUTH_USER_KEY = '@rigor_auth_user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);

      if (token && userStr) {
        const baseUrl = getApiUrl();
        const res = await fetch(new URL('/api/auth/me', baseUrl).toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          const refreshToken = await AsyncStorage.getItem(AUTH_REFRESH_KEY);
          if (refreshToken) {
            const refreshRes = await fetch(new URL('/api/auth/refresh', baseUrl).toString(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              if (refreshData.session && refreshData.user) {
                await saveSession(refreshData.session, refreshData.user);
                setUser(refreshData.user);
              } else {
                await clearSession();
              }
            } else {
              await clearSession();
            }
          } else {
            await clearSession();
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = async (session: any, userData: User) => {
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, session.access_token),
      AsyncStorage.setItem(AUTH_REFRESH_KEY, session.refresh_token),
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData)),
    ]);
  };

  const clearSession = async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_REFRESH_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
    setUser(null);
  };

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/auth/login', baseUrl).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Login failed' };

      await saveSession(data.session, data.user);
      setUser(data.user);
      return {};
    } catch (e: any) {
      return { error: e.message || 'Connection error' };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string): Promise<{ error?: string; confirmEmail?: boolean }> => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/auth/signup', baseUrl).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Signup failed' };

      if (data.session && data.user) {
        await saveSession(data.session, data.user);
        setUser(data.user);
        return {};
      }

      return { confirmEmail: true };
    } catch (e: any) {
      return { error: e.message || 'Connection error' };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<{ error?: string }> => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/auth/forgot-password', baseUrl).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Failed to send reset email' };
      return {};
    } catch (e: any) {
      return { error: e.message || 'Connection error' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        const baseUrl = getApiUrl();
        await fetch(new URL('/api/auth/logout', baseUrl).toString(), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {}
    await clearSession();
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    forgotPassword,
    logout,
  }), [user, isLoading, login, signup, forgotPassword, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
