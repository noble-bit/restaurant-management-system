import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, JwtTokenResponse } from '../types';
import { loginApi, getMeApi, setPasswordApi } from '../api/auth';
import { setTokens, setOnUnauthenticated, getAccessToken, getRefreshToken } from '../api/axios';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updatePassword: (currentPass: string, newPass: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken());
  const [refreshToken, setRefreshTokenState] = useState<string | null>(() => getRefreshToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const updateTokens = useCallback((access: string | null, refresh: string | null = null) => {
    setAccessTokenState(access);
    if (refresh !== null) {
      setRefreshTokenState(refresh);
    }
    setTokens(access, refresh);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    updateTokens(null, null);
  }, [updateTokens]);

  const fetchProfile = useCallback(async (): Promise<User | null> => {
    try {
      const meData = await getMeApi();
      setUser(meData);
      return meData;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      logout();
      return null;
    }
  }, [logout]);

  // Handle automatic logout if Axios encounters unrecoverable 401
  useEffect(() => {
    setOnUnauthenticated(() => {
      logout();
    });
  }, [logout]);

  // Page Refresh Resilience: Attempt session restoration on app initialization
  useEffect(() => {
    const initAuth = async () => {
      const storedAccess = getAccessToken();
      const storedRefresh = getRefreshToken();
      if (storedAccess || storedRefresh) {
        try {
          await fetchProfile();
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchProfile, logout]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data: JwtTokenResponse = await loginApi(email, pass);
      updateTokens(data.access, data.refresh);

      // Fetch complete user profile from /auth/users/me/
      const profile = await fetchProfile();

      // If backend returns must_change_password or role in token response, merge if missing
      if (profile && data.must_change_password !== undefined) {
        setUser((prev) => (prev ? { ...prev, must_change_password: data.must_change_password! } : prev));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (currentPass: string, newPass: string) => {
    await setPasswordApi(currentPass, newPass);
    // After password change, must_change_password becomes false
    if (user) {
      setUser({ ...user, must_change_password: false });
    }
    await fetchProfile();
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isLoading,
        login,
        logout,
        updatePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
