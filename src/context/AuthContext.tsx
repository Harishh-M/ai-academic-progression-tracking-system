import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Faculty, Student } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  facultyId?: string;
  studentId?: string;
  name: string;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  role: UserRole | null;
  profile: Faculty | Student | null;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  switchUser: (username: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('erp_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('erp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState<Faculty | Student | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      if (token) {
        const res = await api.getMe();
        setUser(res.user);
        setProfile(res.profile);
        localStorage.setItem('erp_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.warn('Session verification failed, resetting token');
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (username: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      localStorage.setItem('erp_token', res.token);
      localStorage.setItem('erp_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);

      // fetch profile details
      const meRes = await api.getMe();
      setProfile(meRes.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = async (username: string) => {
    await login(username);
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (token) {
      const res = await api.getMe();
      setProfile(res.profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role || null,
        profile,
        isLoading,
        login,
        logout,
        switchUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
