import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../lib/api";
import { User } from "../types/user";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "redditCloneUser";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const persistUser = (nextUser: User | null) => {
    if (typeof window === "undefined") return;
    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    const nextUser = await authApi.signup(email, password, displayName);
    setUser(nextUser);
    persistUser(nextUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const nextUser = await authApi.login(email, password);
    setUser(nextUser);
    persistUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    persistUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const response = await authApi.resetPassword(email);
    return response.message;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signup,
      login,
      logout,
      resetPassword,
    }),
    [user, loading, signup, login, logout, resetPassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};
