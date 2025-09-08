import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan kullanıcı bilgilerini kontrol et
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('User data parse error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    console.log('Login response:', response.data);

    // Backend cevabına göre doğru destructuring
    const { token, refreshToken, expiresAt, user: userData } = response.data.data;

    // localStorage’a kaydet
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('expiresAt', expiresAt);
    localStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);

    return response;
  };

  const logout = () => {
    authService.logout(); // opsiyonel, backend logout isteği varsa
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Rol kontrolü fonksiyonları
  const isAdmin = () => {
    return user?.roles?.includes('Admin') || false;
  };

  const isStaff = () => {
    return user?.roles?.includes('Staff') || false;
  };

  const canCreate = () => {
    return isAdmin();
  };

  const canUpdate = () => {
    return isAdmin();
  };

  const canDelete = () => {
    return isAdmin();
  };

  const canManageUsers = () => {
    return isAdmin();
  };

  const canRead = () => {
    return isAdmin() || isStaff();
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAdmin,
    isStaff,
    canCreate,
    canUpdate,
    canDelete,
    canManageUsers,
    canRead
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
