import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  country: string;
  plan: string | null;
  features: { ppt: boolean; pdf: boolean };
  downloadsAllowed: number;
  downloadsUsed: number;
  expiresAt: string | null;
}

interface UserContextType {
  user: UserData | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  requestDownload: (type: 'pdf' | 'ppt') => Promise<{ success: boolean; error?: string }>;
}

const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('geostrate_user_token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('geostrate_user_token'));

  // Hydrate user on mount if token exists
  useEffect(() => {
    if (token) {
      refresh().catch(() => {
        // Token invalid, clear it
        logout();
      }).finally(() => setLoading(false));
    }
  }, []);

  const refresh = async () => {
    if (!token) return;
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Session expired');
    const data = await res.json();
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('geostrate_user_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    localStorage.setItem('geostrate_user_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('geostrate_user_token');
    setToken(null);
    setUser(null);
  };

  const requestDownload = async (type: 'pdf' | 'ppt'): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not logged in' };
    const res = await fetch('/api/auth/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ type })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    // Refresh user data to get updated usage
    await refresh();
    return { success: true };
  };

  const updateProfile = async (name: string) => {
    if (!token) return;
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    setUser(data.user);
  };

  return (
    <UserContext.Provider value={{ user, token, loading, login, register, logout, refresh, updateProfile, requestDownload }}>
      {children}
    </UserContext.Provider>
  );
}
