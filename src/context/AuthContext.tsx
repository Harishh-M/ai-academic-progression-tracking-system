import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Faculty, Student } from '../types/index.js';
import { api } from '../services/api.js';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  facultyId?: string;
  studentId?: string;
  name: string;
}

export function getDashboardPath(role?: UserRole | null): string {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'FACULTY':
      return '/faculty/dashboard';
    case 'COE':
      return '/coe/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/login';
  }
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  role: UserRole | null;
  profile: any;
  isLoading: boolean;
  loading: boolean;
  login: (username: string, password?: string) => Promise<string>;
  logout: () => void;
  switchUser: (username: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('erp_token');
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('erp_user');
      return saved && saved !== 'undefined' && saved !== 'null' ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      if (token) {
        const res = await api.getMe();
        if (res && res.user) {
          setUser(res.user);
          setProfile(res.profile);
          try {
            localStorage.setItem('erp_user', JSON.stringify(res.user));
          } catch {
            // ignore storage quota error
          }
        } else {
          logout();
        }
      }
    } catch (err) {
      console.warn('Session verification failed, resetting token:', err);
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

  const login = async (username: string, password?: string): Promise<string> => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      localStorage.setItem('erp_token', res.token);
      localStorage.setItem('erp_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);

      // fetch profile details
      try {
        const meRes = await api.getMe();
        setProfile(meRes.profile);
      } catch {
        // non-blocking
      }

      // Determine destination dashboard path according to role
      const redirectPath = getDashboardPath(res.role || res.user.role);
      window.history.pushState({}, '', redirectPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return redirectPath;
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = async (username: string) => {
    await login(username, 'password123');
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setToken(null);
    setUser(null);
    setProfile(null);
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
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
        loading: isLoading,
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
