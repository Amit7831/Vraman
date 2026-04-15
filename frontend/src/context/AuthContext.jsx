import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Normalize user object so avatar & profileImage are always in sync
const normalizeUser = (data) => {
  if (!data) return null;
  const img = data.profileImage || data.avatar || null;
  return { ...data, avatar: img, profileImage: img };
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('vraman_user');
    const token  = localStorage.getItem('vraman_token');
    if (stored && token) {
      try { setUser(normalizeUser(JSON.parse(stored))); } catch { logout(); }
    }
    setLoading(false);
  }, []);

  const persist = (data) => {
    const normalized = normalizeUser(data);
    localStorage.setItem('vraman_token', data.token);
    localStorage.setItem('vraman_user',  JSON.stringify(normalized));
    setUser(normalized);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    persist(res.data);
    return res.data;
  };

  const register = async (name, email, password, phone) => {
    const res = await api.post('/auth/register', { name, email, password, phone });
    persist(res.data);
    return res.data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('vraman_token');
    localStorage.removeItem('vraman_user');
    setUser(null);
  }, []);

  // updateUser merges partial data and keeps avatar/profileImage in sync
  const updateUser = (data) => {
    const merged     = normalizeUser({ ...user, ...data });
    localStorage.setItem('vraman_user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register, logout, updateUser,
      isAdmin:  user?.role === 'admin',
      isVendor: user?.role === 'vendor',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
