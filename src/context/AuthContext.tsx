import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Workspace, CoupleProfile } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  coupleProfile: CoupleProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>;
  setCoupleProfile: React.Dispatch<React.SetStateAction<CoupleProfile | null>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [coupleProfile, setCoupleProfile] = useState<CoupleProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSession = async () => {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
      setWorkspace(data.workspace || null);
      setCoupleProfile(data.coupleProfile || null);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      api.setToken(null);
      setUser(null);
      setWorkspace(null);
      setCoupleProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (identifier: string, pass: string) => {
    const res = await api.login(identifier, pass);
    setUser(res.user);
    setWorkspace(res.workspace || null);
    setCoupleProfile(res.coupleProfile || null);
  };

  const register = async (payload: any) => {
    const res = await api.register(payload);
    setUser(res.user);
    setWorkspace(res.workspace);
    setCoupleProfile(res.coupleProfile);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setWorkspace(null);
    setCoupleProfile(null);
  };

  const refreshMe = async () => {
    await fetchSession();
  };

  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const mustChangePassword = !!user?.must_change_password;

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        coupleProfile,
        loading,
        isAuthenticated,
        isSuperAdmin,
        mustChangePassword,
        login,
        register,
        logout,
        refreshMe,
        setWorkspace,
        setCoupleProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
